import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RestorationStep, StepStatus, StepType } from '../entities/restoration-step.entity';
import { RestorationRequest } from '../entities/restoration-request.entity';
import { Material } from '../entities/material.entity';
import { CreateRestorationStepDto, CompleteStepDto, UpdateRestorationStepDto, SupplementBatchDto } from '../dto/restoration-step.dto';
import { BusinessRulesService } from './business-rules.service';

@Injectable()
export class RestorationStepService {
  constructor(
    @InjectRepository(RestorationStep)
    private readonly stepRepository: Repository<RestorationStep>,
    @InjectRepository(RestorationRequest)
    private readonly requestRepository: Repository<RestorationRequest>,
    private readonly dataSource: DataSource,
    private readonly businessRulesService: BusinessRulesService,
  ) {}

  async findByRequestId(requestId: string): Promise<RestorationStep[]> {
    const steps = await this.stepRepository.find({
      where: { requestId },
      relations: ['material', 'performedBy'],
      order: { stepOrder: 'ASC' },
    });
    return steps;
  }

  async findOne(id: string): Promise<RestorationStep> {
    const step = await this.stepRepository.findOne({
      where: { id },
      relations: ['request', 'material', 'performedBy'],
    });
    if (!step) {
      throw new NotFoundException('工序不存在');
    }
    return step;
  }

  async startStep(id: string, performerId: string): Promise<RestorationStep> {
    return this.dataSource.transaction(async (manager) => {
      const step = await manager.findOne(RestorationStep, {
        where: { id },
        relations: ['request'],
      });
      
      if (!step) {
        throw new NotFoundException('工序不存在');
      }

      if (step.status !== 'pending') {
        throw new BadRequestException(`该工序当前状态为「${this.getStatusName(step.status)}」，无法开始`);
      }

      const steps = await manager.find(RestorationStep, {
        where: { requestId: step.requestId },
        order: { stepOrder: 'ASC' },
      });

      const currentIndex = steps.findIndex(s => s.id === step.id);
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1];
        if (prevStep.status !== 'completed') {
          throw new BadRequestException(`前一道工序「${prevStep.displayName}」尚未完成`);
        }
      }

      step.status = 'in_progress';
      step.startTime = new Date();
      step.performedById = performerId;

      return manager.save(step);
    });
  }

  async completeStep(id: string, dto: CompleteStepDto): Promise<RestorationStep> {
    return this.dataSource.transaction(async (manager) => {
      const step = await manager.findOne(RestorationStep, {
        where: { id },
        relations: ['request'],
      });
      
      if (!step) {
        throw new NotFoundException('工序不存在');
      }

      if (step.status !== 'in_progress') {
        throw new BadRequestException(`该工序当前状态为「${this.getStatusName(step.status)}」，无法完成`);
      }

      const hasBatch = dto.materialBatch && dto.materialBatch.trim() !== '';

      if (dto.materialId) {
        await this.businessRulesService.validateMaterialBatchNumber(dto.materialId);
        
        const material = await manager.findOne(Material, { where: { id: dto.materialId } });
        if (material && material.quantity > 0) {
          material.quantity -= 1;
          await manager.save(material);
        }
      }

      step.endTime = new Date();
      step.performedById = dto.performedById;
      step.materialId = dto.materialId || step.materialId;
      step.notes = dto.notes || step.notes;

      if (hasBatch) {
        step.status = 'completed';
        step.materialBatch = dto.materialBatch;
      } else {
        step.status = 'pending_batch';
        step.materialBatch = null;
      }

      const completedStep = await manager.save(step);

      const allSteps = await manager.find(RestorationStep, {
        where: { requestId: step.requestId },
      });

      const allCompleted = allSteps.every(s => s.status === 'completed');
      if (allCompleted) {
        const request = await manager.findOne(RestorationRequest, { 
          where: { id: step.requestId },
          relations: ['book'],
        });
        
        if (request) {
          const workflow = await this.businessRulesService.getRequiredWorkflow(request.bookId);
          if (workflow.requiresExpertReview) {
            request.status = 'review_pending';
          }
          await manager.save(request);
        }
      }

      return completedStep;
    });
  }

  async supplementBatch(id: string, dto: SupplementBatchDto): Promise<RestorationStep> {
    return this.dataSource.transaction(async (manager) => {
      const step = await manager.findOne(RestorationStep, {
        where: { id },
        relations: ['request'],
      });

      if (!step) {
        throw new NotFoundException('工序不存在');
      }

      if (step.status !== 'pending_batch') {
        throw new BadRequestException(
          `该工序当前状态为「${this.getStatusName(step.status)}」，仅待补录工序可补录材料批号`,
        );
      }

      if (!dto.materialBatch || dto.materialBatch.trim() === '') {
        throw new BadRequestException('材料批号不能为空');
      }

      step.materialBatch = dto.materialBatch;
      if (dto.materialId) {
        await this.businessRulesService.validateMaterialBatchNumber(dto.materialId);
        step.materialId = dto.materialId;
      }
      if (dto.notes) {
        step.notes = dto.notes;
      }
      step.status = 'completed';

      const updatedStep = await manager.save(step);

      const allSteps = await manager.find(RestorationStep, {
        where: { requestId: step.requestId },
      });

      const allCompleted = allSteps.every(s => s.status === 'completed');
      if (allCompleted) {
        const request = await manager.findOne(RestorationRequest, {
          where: { id: step.requestId },
          relations: ['book'],
        });

        if (request) {
          const workflow = await this.businessRulesService.getRequiredWorkflow(request.bookId);
          if (workflow.requiresExpertReview) {
            request.status = 'review_pending';
          }
          await manager.save(request);
        }
      }

      return updatedStep;
    });
  }

  async update(id: string, dto: UpdateRestorationStepDto): Promise<RestorationStep> {
    const step = await this.findOne(id);
    
    if (step.status === 'completed') {
      throw new BadRequestException('已完成的工序无法修改');
    }

    if (dto.materialId) {
      await this.businessRulesService.validateMaterialBatchNumber(dto.materialId);
    }

    Object.assign(step, dto);
    return this.stepRepository.save(step);
  }

  async create(dto: CreateRestorationStepDto): Promise<RestorationStep> {
    const existing = await this.stepRepository.findOne({
      where: { requestId: dto.requestId, stepType: dto.stepType as StepType },
    });
    
    if (existing) {
      throw new BadRequestException('该工序已存在');
    }

    const step = this.stepRepository.create({
      ...dto,
      stepType: dto.stepType as StepType,
    });
    
    return this.stepRepository.save(step);
  }

  async remove(id: string): Promise<void> {
    const step = await this.findOne(id);
    
    if (step.status !== 'pending') {
      throw new BadRequestException('只能删除待执行状态的工序');
    }

    await this.stepRepository.delete(id);
  }

  async getStepTypes(): Promise<{ type: StepType; name: string; order: number; description: string }[]> {
    return [
      { type: 'deacidification', name: '脱酸', order: 1, description: '使用脱酸剂处理纸张，延长保存寿命' },
      { type: 'paper_mending', name: '补纸', order: 2, description: '使用宣纸修补破损页面' },
      { type: 'binding', name: '装帧', order: 3, description: '重新装订书籍，恢复完整形态' },
    ];
  }

  private getStatusName(status: StepStatus): string {
    const names: Record<StepStatus, string> = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
      pending_batch: '待补录',
    };
    return names[status] || status;
  }
}
