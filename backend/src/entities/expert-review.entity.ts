import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RestorationRequest } from './restoration-request.entity';
import { User } from './user.entity';

export type ReviewDecision = 'approved' | 'rejected' | 'needs_revision';

@Entity('expert_reviews')
export class ExpertReview {
  @ApiProperty({ description: '评审ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '修复申请ID' })
  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @ApiProperty({ description: '评审专家ID' })
  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ApiProperty({ description: '评审决定', enum: ['approved', 'rejected', 'needs_revision'] })
  @Column({ type: 'enum', enum: ['approved', 'rejected', 'needs_revision'] })
  decision: ReviewDecision;

  @ApiProperty({ description: '评审意见', required: false })
  @Column({ name: 'review_comments', type: 'text', nullable: true })
  reviewComments: string;

  @ApiProperty({ description: '是否可开放阅览', default: false })
  @Column({ name: 'can_open_for_reading', type: 'boolean', default: false })
  canOpenForReading: boolean;

  @ApiProperty({ description: '评审日期', required: false })
  @Column({ name: 'review_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reviewDate: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RestorationRequest, request => request.reviews)
  @JoinColumn({ name: 'request_id' })
  request: RestorationRequest;

  @ManyToOne(() => User, user => user.reviews)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;
}
