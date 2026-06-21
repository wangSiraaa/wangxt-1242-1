import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AncientBook, RarityLevel } from '../entities/ancient-book.entity';
import { Material } from '../entities/material.entity';
import { BookImage } from '../entities/book-image.entity';
import { ExpertReview } from '../entities/expert-review.entity';
import { RestorationStep } from '../entities/restoration-step.entity';

@Injectable()
export class BusinessRulesService {
  constructor(
    @InjectRepository(AncientBook)
    private readonly bookRepository: Repository<AncientBook>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(BookImage)
    private readonly imageRepository: Repository<BookImage>,
    @InjectRepository(ExpertReview)
    private readonly reviewRepository: Repository<ExpertReview>,
  ) {}

  async validatePreciousBookReview(requestId: string, bookId: string): Promise<void> {
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new BadRequestException('古籍不存在');
    }

    if (this.isPreciousBook(book.rarityLevel)) {
      const hasApprovedReview = await this.reviewRepository.findOne({
        where: { requestId, decision: 'approved' },
      });

      if (!hasApprovedReview) {
        throw new ForbiddenException(
          `珍贵等级为「${this.getRarityLevelName(book.rarityLevel)}」的古籍必须通过专家评审才能完成修复流程`
        );
      }
    }
  }

  async validateMaterialBatchNumber(materialId: string | undefined): Promise<void> {
    if (!materialId) return;

    const material = await this.materialRepository.findOne({ where: { id: materialId } });
    if (!material) {
      throw new BadRequestException('修复材料不存在');
    }

    if (!material.batchNumber || material.batchNumber.trim() === '') {
      throw new BadRequestException(`材料「${material.name}」的批号缺失，无法提交工序`);
    }
  }

  async validateRestorationImages(requestId: string, bookId: string): Promise<void> {
    const [beforeImage, afterImage] = await Promise.all([
      this.imageRepository.findOne({
        where: { requestId, imageType: 'before_restoration' },
      }),
      this.imageRepository.findOne({
        where: { requestId, imageType: 'after_restoration' },
      }),
    ]);

    if (!beforeImage) {
      throw new BadRequestException('必须上传修复前的照片才能开放阅览');
    }
    if (!afterImage) {
      throw new BadRequestException('必须上传修复后的照片才能开放阅览');
    }
  }

  async validateStepCompletion(step: RestorationStep): Promise<boolean> {
    if (!step.materialBatch || step.materialBatch.trim() === '') {
      return false;
    }
    return true;
  }

  async checkCanOpenForReading(requestId: string, bookId: string): Promise<boolean> {
    const [hasBeforeImage, hasAfterImage, hasApprovedReview] = await Promise.all([
      this.imageRepository.exist({ where: { requestId, imageType: 'before_restoration' } }),
      this.imageRepository.exist({ where: { requestId, imageType: 'after_restoration' } }),
      this.reviewRepository.exist({ where: { requestId, decision: 'approved', canOpenForReading: true } }),
    ]);

    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    const needsReview = book && this.isPreciousBook(book.rarityLevel);

    if (needsReview && !hasApprovedReview) {
      return false;
    }

    return hasBeforeImage && hasAfterImage;
  }

  isPreciousBook(rarityLevel: RarityLevel): boolean {
    return rarityLevel === 'precious' || rarityLevel === 'national_treasure';
  }

  getRarityLevelName(level: RarityLevel): string {
    const names: Record<RarityLevel, string> = {
      common: '普通',
      rare: '珍贵',
      precious: '三级文物',
      national_treasure: '国宝级',
    };
    return names[level] || level;
  }

  async validateBorrowing(bookId: string): Promise<void> {
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new BadRequestException('古籍不存在');
    }

    if (book.currentStatus === 'under_restoration') {
      throw new ForbiddenException('该古籍正在修复中，暂不可借阅');
    }
    if (book.currentStatus === 'permanently_restricted') {
      throw new ForbiddenException('该古籍被永久限制阅览');
    }
    if (book.currentStatus === 'restricted') {
      throw new ForbiddenException('该古籍被限制阅览，需经特别审批');
    }
  }

  async getRequiredWorkflow(bookId: string): Promise<{
    requiresExpertReview: boolean;
    requiredSteps: string[];
    requiredImages: string[];
  }> {
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new BadRequestException('古籍不存在');
    }

    const requiresExpertReview = this.isPreciousBook(book.rarityLevel);
    
    return {
      requiresExpertReview,
      requiredSteps: ['deacidification', 'paper_mending', 'binding'],
      requiredImages: ['before_restoration', 'after_restoration'],
    };
  }
}
