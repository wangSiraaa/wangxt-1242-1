import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ExpertReview, ReviewDecision } from '../entities/expert-review.entity';
import { RestorationRequest } from '../entities/restoration-request.entity';
import { User } from '../entities/user.entity';
import { CreateExpertReviewDto, UpdateExpertReviewDto } from '../dto/expert-review.dto';
import { BusinessRulesService } from './business-rules.service';

@Injectable()
export class ExpertReviewService {
  constructor(
    @InjectRepository(ExpertReview)
    private readonly reviewRepository: Repository<ExpertReview>,
    @InjectRepository(RestorationRequest)
    private readonly requestRepository: Repository<RestorationRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly businessRulesService: BusinessRulesService,
  ) {}

  async findAll(page: number = 1, limit: number = 10, requestId?: string, reviewerId?: string, decision?: ReviewDecision): Promise<{
    data: ExpertReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.request', 'request')
      .leftJoinAndSelect('request.book', 'book');

    if (requestId) {
      query.andWhere('review.requestId = :requestId', { requestId });
    }
    if (reviewerId) {
      query.andWhere('review.reviewerId = :reviewerId', { reviewerId });
    }
    if (decision) {
      query.andWhere('review.decision = :decision', { decision });
    }

    query.orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ExpertReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'request', 'request.book'],
    });
    if (!review) {
      throw new NotFoundException('评审记录不存在');
    }
    return review;
  }

  async findByRequestId(requestId: string): Promise<ExpertReview[]> {
    return this.reviewRepository.find({
      where: { requestId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateExpertReviewDto): Promise<ExpertReview> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RestorationRequest, {
        where: { id: dto.requestId },
        relations: ['book'],
      });
      
      if (!request) {
        throw new NotFoundException('修复申请不存在');
      }

      const reviewer = await manager.findOne(User, { where: { id: dto.reviewerId } });
      if (!reviewer) {
        throw new NotFoundException('评审专家不存在');
      }

      if (reviewer.role !== 'expert') {
        throw new ForbiddenException('只有专家角色才能进行评审');
      }

      const workflow = await this.businessRulesService.getRequiredWorkflow(request.bookId);
      if (!workflow.requiresExpertReview) {
        throw new BadRequestException('该古籍不需要专家评审');
      }

      if (request.status !== 'review_pending') {
        throw new BadRequestException(`当前申请状态为「${this.getRequestStatusName(request.status)}」，无法进行评审`);
      }

      const review = manager.create(ExpertReview, {
        ...dto,
        reviewDate: new Date(),
      });

      const savedReview = await manager.save(review);

      if (dto.decision === 'approved') {
        request.status = 'review_approved';
      } else if (dto.decision === 'rejected') {
        request.status = 'review_rejected';
      }
      await manager.save(request);

      return savedReview;
    });
  }

  async update(id: string, dto: UpdateExpertReviewDto): Promise<ExpertReview> {
    const review = await this.findOne(id);
    Object.assign(review, dto);
    return this.reviewRepository.save(review);
  }

  async getPendingReviews(expertId: string): Promise<RestorationRequest[]> {
    const requests = await this.requestRepository.find({
      where: { status: 'review_pending' },
      relations: ['book', 'requestedBy', 'steps', 'images'],
      order: { urgencyLevel: 'DESC', createdAt: 'ASC' },
    });

    const expert = await this.userRepository.findOne({ where: { id: expertId } });
    if (!expert || expert.role !== 'expert') {
      throw new ForbiddenException('只有专家角色才能查看待评审列表');
    }

    return requests;
  }

  async checkCanReview(requestId: string, reviewerId: string): Promise<{
    canReview: boolean;
    reason?: string;
    requiredChecks: {
      hasBeforeImage: boolean;
      hasAfterImage: boolean;
      allStepsCompleted: boolean;
      isCorrectStatus: boolean;
      isPreciousBook: boolean;
    };
  }> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['book', 'steps', 'images'],
    });

    if (!request) {
      throw new NotFoundException('修复申请不存在');
    }

    const hasBeforeImage = request.images.some(img => img.imageType === 'before_restoration');
    const hasAfterImage = request.images.some(img => img.imageType === 'after_restoration');
    const allStepsCompleted = request.steps.every(s => s.status === 'completed');
    const isCorrectStatus = request.status === 'review_pending';
    const isPreciousBook = this.businessRulesService.isPreciousBook(request.book.rarityLevel);

    let canReview = true;
    let reason: string | undefined;

    if (!isPreciousBook) {
      canReview = false;
      reason = '该古籍不是珍贵等级，无需专家评审';
    } else if (!isCorrectStatus) {
      canReview = false;
      reason = `当前状态为「${this.getRequestStatusName(request.status)}」，不可评审`;
    } else if (!allStepsCompleted) {
      canReview = false;
      reason = '还有修复工序未完成';
    }

    return {
      canReview,
      reason,
      requiredChecks: {
        hasBeforeImage,
        hasAfterImage,
        allStepsCompleted,
        isCorrectStatus,
        isPreciousBook,
      },
    };
  }

  private getRequestStatusName(status: string): string {
    const names: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已批准',
      in_progress: '修复中',
      review_pending: '待评审',
      review_approved: '评审通过',
      review_rejected: '评审驳回',
      completed: '已完成',
      cancelled: '已取消',
    };
    return names[status] || status;
  }
}
