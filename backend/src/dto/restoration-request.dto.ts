import { IsUUID, IsString, IsOptional, IsInt, Min, Max, IsEnum, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../entities/restoration-request.entity';

export class CreateRestorationRequestDto {
  @ApiProperty({ description: '古籍ID' })
  @IsUUID()
  bookId: string;

  @ApiProperty({ description: '申请人ID' })
  @IsUUID()
  requestedById: string;

  @ApiProperty({ description: '申请理由' })
  @IsString()
  requestReason: string;

  @ApiPropertyOptional({ description: '紧急程度 1-5', default: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  urgencyLevel?: number;

  @ApiPropertyOptional({ description: '预计完成日期' })
  @IsOptional()
  @IsDate()
  estimatedCompletionDate?: Date;
}

export class UpdateRestorationRequestDto {
  @ApiPropertyOptional({ description: '申请理由' })
  @IsOptional()
  @IsString()
  requestReason?: string;

  @ApiPropertyOptional({ description: '紧急程度 1-5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  urgencyLevel?: number;

  @ApiPropertyOptional({ description: '预计完成日期' })
  @IsOptional()
  @IsDate()
  estimatedCompletionDate?: Date;
}

export class UpdateRequestStatusDto {
  @ApiProperty({ 
    description: '新状态', 
    enum: ['draft', 'submitted', 'approved', 'in_progress', 'review_pending', 'review_approved', 'review_rejected', 'completed', 'cancelled']
  })
  @IsEnum(['draft', 'submitted', 'approved', 'in_progress', 'review_pending', 'review_approved', 'review_rejected', 'completed', 'cancelled'])
  status: RequestStatus;

  @ApiPropertyOptional({ description: '操作人ID（审批时需要）' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
