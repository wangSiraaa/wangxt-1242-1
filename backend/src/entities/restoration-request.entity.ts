import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AncientBook } from './ancient-book.entity';
import { User } from './user.entity';
import { RestorationStep } from './restoration-step.entity';
import { BookImage } from './book-image.entity';
import { ExpertReview } from './expert-review.entity';

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'in_progress' | 'review_pending' | 'review_approved' | 'review_rejected' | 'completed' | 'cancelled';

@Entity('restoration_requests')
export class RestorationRequest {
  @ApiProperty({ description: '修复申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请编号', maxLength: 50 })
  @Column({ name: 'request_no', type: 'varchar', length: 50, unique: true })
  requestNo: string;

  @ApiProperty({ description: '古籍ID' })
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ApiProperty({ description: '申请人ID' })
  @Column({ name: 'requested_by', type: 'uuid' })
  requestedById: string;

  @ApiProperty({ description: '申请理由' })
  @Column({ name: 'request_reason', type: 'text' })
  requestReason: string;

  @ApiProperty({ description: '紧急程度 1-5', default: 3, minimum: 1, maximum: 5 })
  @Column({ name: 'urgency_level', type: 'integer', default: 3 })
  urgencyLevel: number;

  @ApiProperty({ 
    description: '申请状态', 
    enum: ['draft', 'submitted', 'approved', 'in_progress', 'review_pending', 'review_approved', 'review_rejected', 'completed', 'cancelled'],
    default: 'draft'
  })
  @Column({ type: 'enum', enum: ['draft', 'submitted', 'approved', 'in_progress', 'review_pending', 'review_approved', 'review_rejected', 'completed', 'cancelled'], default: 'draft' })
  status: RequestStatus;

  @ApiProperty({ description: '提交时间', required: false })
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @ApiProperty({ description: '批准时间', required: false })
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @ApiProperty({ description: '批准人ID', required: false })
  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedById: string;

  @ApiProperty({ description: '预计完成日期', required: false })
  @Column({ name: 'estimated_completion_date', type: 'date', nullable: true })
  estimatedCompletionDate: Date;

  @ApiProperty({ description: '实际完成日期', required: false })
  @Column({ name: 'actual_completion_date', type: 'date', nullable: true })
  actualCompletionDate: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AncientBook, book => book.restorationRequests)
  @JoinColumn({ name: 'book_id' })
  book: AncientBook;

  @ManyToOne(() => User, user => user.submittedRequests)
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @OneToMany(() => RestorationStep, step => step.request, { cascade: true })
  steps: RestorationStep[];

  @OneToMany(() => BookImage, image => image.request)
  images: BookImage[];

  @OneToMany(() => ExpertReview, review => review.request)
  reviews: ExpertReview[];

  get requiresExpertReview(): boolean {
    return this.book?.isPrecious ?? false;
  }

  get hasApprovedReview(): boolean {
    return this.reviews?.some(r => r.decision === 'approved') ?? false;
  }

  get hasCompleteImages(): boolean {
    if (!this.images) return false;
    const hasBefore = this.images.some(img => img.imageType === 'before_restoration');
    const hasAfter = this.images.some(img => img.imageType === 'after_restoration');
    return hasBefore && hasAfter;
  }

  get canComplete(): boolean {
    if (this.requiresExpertReview && !this.hasApprovedReview) {
      return false;
    }
    if (!this.hasCompleteImages) {
      return false;
    }
    const allStepsCompleted = this.steps?.every(s => s.status === 'completed') ?? true;
    return allStepsCompleted;
  }
}
