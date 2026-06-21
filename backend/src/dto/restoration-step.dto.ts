import { IsUUID, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepStatus } from '../entities/restoration-step.entity';

export class CreateRestorationStepDto {
  @ApiProperty({ description: '修复申请ID' })
  @IsUUID()
  requestId: string;

  @ApiProperty({ description: '工序类型', enum: ['deacidification', 'paper_mending', 'binding'] })
  @IsEnum(['deacidification', 'paper_mending', 'binding'])
  stepType: string;

  @ApiProperty({ description: '工序顺序' })
  stepOrder: number;

  @ApiPropertyOptional({ description: '使用材料ID' })
  @IsOptional()
  @IsUUID()
  materialId?: string;
}

export class UpdateRestorationStepDto {
  @ApiPropertyOptional({ 
    description: '工序状态', 
    enum: ['pending', 'in_progress', 'completed', 'pending_batch']
  })
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'pending_batch'])
  status?: StepStatus;

  @ApiPropertyOptional({ description: '执行人ID' })
  @IsOptional()
  @IsUUID()
  performedById?: string;

  @ApiPropertyOptional({ description: '使用材料ID' })
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional({ description: '材料批号' })
  @IsOptional()
  @IsString()
  materialBatch?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteStepDto {
  @ApiProperty({ description: '执行人ID' })
  @IsUUID()
  performedById: string;

  @ApiPropertyOptional({ description: '使用材料ID' })
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional({ description: '材料批号（缺失时工序保存为待补录状态）' })
  @IsOptional()
  @IsString()
  materialBatch?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SupplementBatchDto {
  @ApiProperty({ description: '材料批号' })
  @IsString()
  materialBatch: string;

  @ApiPropertyOptional({ description: '使用材料ID' })
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
