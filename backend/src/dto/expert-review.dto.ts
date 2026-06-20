import { IsUUID, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewDecision } from '../entities/expert-review.entity';

export class CreateExpertReviewDto {
  @ApiProperty({ description: '修复申请ID' })
  @IsUUID()
  requestId: string;

  @ApiProperty({ description: '评审专家ID' })
  @IsUUID()
  reviewerId: string;

  @ApiProperty({ 
    description: '评审决定', 
    enum: ['approved', 'rejected', 'needs_revision']
  })
  @IsEnum(['approved', 'rejected', 'needs_revision'])
  decision: ReviewDecision;

  @ApiPropertyOptional({ description: '评审意见' })
  @IsOptional()
  @IsString()
  reviewComments?: string;

  @ApiPropertyOptional({ description: '是否可开放阅览', default: false })
  @IsOptional()
  @IsBoolean()
  canOpenForReading?: boolean;
}

export class UpdateExpertReviewDto {
  @ApiPropertyOptional({ 
    description: '评审决定', 
    enum: ['approved', 'rejected', 'needs_revision']
  })
  @IsOptional()
  @IsEnum(['approved', 'rejected', 'needs_revision'])
  decision?: ReviewDecision;

  @ApiPropertyOptional({ description: '评审意见' })
  @IsOptional()
  @IsString()
  reviewComments?: string;

  @ApiPropertyOptional({ description: '是否可开放阅览' })
  @IsOptional()
  @IsBoolean()
  canOpenForReading?: boolean;
}
