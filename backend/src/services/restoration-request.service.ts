import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RestorationRequest, RequestStatus } from '../entities/restoration-request.entity';
import { RestorationStep, StepType } from '../entities/restoration-step.entity';
import { AncientBook } from '../entities/ancient-book.entity';
import { CreateRestorationRequestDto, UpdateRestorationRequestDto, UpdateRequestStatusDto } from '../dto/restoration-request.dto';
import { BusinessRulesService } from './business-rules.service';

@Injectable()
export class RestorationRequestService {
  constructor(
    @InjectRepository(RestorationRequest)
    private readonly requestRepository: Repository<RestorationRequest>,
    @InjectRepository(RestorationStep)
    private readonly stepRepository: Repository<RestorationStep>,
    @InjectRepository(AncientBook)
    private readonly bookRepository: Repository<AncientBook>,
    private readonly dataSource: DataSource,
    private readonly businessRulesService: BusinessRulesService,
  ) {}

  async findAll(page: number = 1, limit: number = 10, status?: RequestStatus, bookId?: string): Promise<{
    data: RestorationRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.requestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.book', 'book')
      .leftJoinAndSelect('request.requestedBy', 'requestedBy')
      .leftJoinAndSelect('request.steps', 'steps')
      .leftJoinAndSelect('request.reviews', 'reviews');

    if (status) {
      query.andWhere('request.status = :status', { status });
    }
    if (bookId) {
      query.andWhere('request.bookId = :bookId', { bookId });
    }

    query.orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<RestorationRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['book', 'requestedBy', 'approvedBy', 'steps', 'steps.material', 'steps.performedBy', 'images', 'reviews', 'reviews.reviewer'],
    });
    if (!request) {
      throw new NotFoundException('修复申请不存在');
    }
    return request;
  }

  async create(dto: CreateRestorationRequestDto): Promise<RestorationRequest> {
    return this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(AncientBook, { where: { id: dto.bookId } });
      if (!book) {
        throw new BadRequestException('古籍不存在');
      }

      if (book.currentStatus === 'under_restoration') {
        throw new BadRequestException('该古籍正在修复中，无法重复提交修复申请');
      }

      const requestNo = await this.generateRequestNo();
      
      const request = manager.create(RestorationRequest, {
        ...dto,
        requestNo,
        status: 'draft',
      });

      const savedRequest = await manager.save(request);

      const steps: StepType[] = ['deacidification', 'paper_mending', 'binding'];
      for (let i = 0; i < steps.length; i++) {
        const step = manager.create(RestorationStep, {
          requestId: savedRequest.id,
          stepType: steps[i],
          stepOrder: i + 1,
          status: 'pending',
        });
        await manager.save(step);
      }

      return savedRequest;
    });
  }

  async update(id: string, dto: UpdateRestorationRequestDto): Promise<RestorationRequest> {
    const request = await this.findOne(id);
    
    if (request.status !== 'draft' && request.status !== 'submitted') {
      throw new BadRequestException('只能修改草稿或待审批状态的申请');
    }

    Object.assign(request, dto);
    return this.requestRepository.save(request);
  }

  async updateStatus(id: string, dto: UpdateRequestStatusDto): Promise<RestorationRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RestorationRequest, {
        where: { id },
        relations: ['book', 'steps', 'reviews'],
      });
      
      if (!request) {
        throw new NotFoundException('修复申请不存在');
      }

      await this.validateStatusTransition(request.status, dto.status, request);

      if (dto.status === 'submitted') {
        request.submittedAt = new Date();
      }
      if (dto.status === 'approved') {
        request.approvedAt = new Date();
        request.approvedById = dto.operatorId;
      }
      if (dto.status === 'completed') {
        request.actualCompletionDate = new Date();
        
        await this.businessRulesService.validatePreciousBookReview(request.id, request.bookId);
        await this.businessRulesService.validateRestorationImages(request.id, request.bookId);
        
        const allStepsCompleted = request.steps.every(s => s.status === 'completed');
        if (!allStepsCompleted) {
          throw new BadRequestException('所有工序必须完成才能标记修复完成');
        }

        const canOpen = await this.businessRulesService.checkCanOpenForReading(request.id, request.bookId);
        const book = await manager.findOne(AncientBook, { where: { id: request.bookId } });
        if (book) {
          book.currentStatus = canOpen ? 'available' : 'restricted';
          await manager.save(book);
        }
      }
      if (dto.status === 'in_progress') {
        const book = await manager.findOne(AncientBook, { where: { id: request.bookId } });
        if (book) {
          book.currentStatus = 'under_restoration';
          await manager.save(book);
        }
      }

      request.status = dto.status;
      return manager.save(request);
    });
  }

  async remove(id: string): Promise<void> {
    const request = await this.findOne(id);
    if (request.status !== 'draft') {
      throw new BadRequestException('只能删除草稿状态的申请');
    }
    await this.requestRepository.delete(id);
  }

  async getWorkflowStatus(id: string): Promise<{
    currentStep: RestorationStep | null;
    nextStep: RestorationStep | null;
    completedSteps: RestorationStep[];
    pendingSteps: RestorationStep[];
    canProceed: boolean;
    blockedReason?: string;
  }> {
    const request = await this.findOne(id);
    const steps = [...request.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    
    const completedSteps = steps.filter(s => s.status === 'completed');
    const pendingSteps = steps.filter(s => s.status === 'pending' || s.status === 'in_progress');
    const currentStep = steps.find(s => s.status === 'in_progress') || pendingSteps[0] || null;
    const nextStepIndex = steps.findIndex(s => s === currentStep) + 1;
    const nextStep = nextStepIndex < steps.length ? steps[nextStepIndex] : null;

    let canProceed = true;
    let blockedReason: string | undefined;

    const workflow = await this.businessRulesService.getRequiredWorkflow(request.bookId);
    
    if (workflow.requiresExpertReview && !request.hasApprovedReview) {
      canProceed = false;
      blockedReason = '珍贵古籍需先通过专家评审';
    }

    if (!request.hasCompleteImages) {
      canProceed = false;
      blockedReason = '请先上传修复前后的照片';
    }

    return {
      currentStep,
      nextStep,
      completedSteps,
      pendingSteps,
      canProceed,
      blockedReason,
    };
  }

  private async generateRequestNo(): Promise<string> {
    const date = new Date();
    const prefix = `RES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    const count = await this.requestRepository
      .createQueryBuilder()
      .where('request_no LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async validateStatusTransition(
    currentStatus: RequestStatus,
    newStatus: RequestStatus,
    request: RestorationRequest,
  ): Promise<void> {
    const validTransitions: Record<RequestStatus, RequestStatus[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled', 'draft'],
      approved: ['in_progress', 'cancelled'],
      in_progress: ['review_pending', 'completed'],
      review_pending: ['review_approved', 'review_rejected'],
      review_approved: ['completed'],
      review_rejected: ['in_progress', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `无法从「${this.getStatusName(currentStatus)}」状态转换为「${this.getStatusName(newStatus)}」`
      );
    }

    if (newStatus === 'review_pending' || newStatus === 'review_approved') {
      const workflow = await this.businessRulesService.getRequiredWorkflow(request.bookId);
      if (!workflow.requiresExpertReview) {
        throw new BadRequestException('该古籍不需要专家评审流程');
      }
    }
  }

  private getStatusName(status: RequestStatus): string {
    const names: Record<RequestStatus, string> = {
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
