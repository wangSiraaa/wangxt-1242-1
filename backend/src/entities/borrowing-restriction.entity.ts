import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AncientBook } from './ancient-book.entity';
import { User } from './user.entity';

export type RestrictionType = 'full' | 'reading_room_only' | 'supervised' | 'digital_only';

@Entity('borrowing_restrictions')
export class BorrowingRestriction {
  @ApiProperty({ description: '限制ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '古籍ID' })
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ApiProperty({ description: '限制类型', enum: ['full', 'reading_room_only', 'supervised', 'digital_only'] })
  @Column({ name: 'restriction_type', type: 'enum', enum: ['full', 'reading_room_only', 'supervised', 'digital_only'] })
  restrictionType: RestrictionType;

  @ApiProperty({ description: '限制原因', required: false })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ description: '生效日期' })
  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @ApiProperty({ description: '到期日期', required: false })
  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @ApiProperty({ description: '设置人ID', required: false })
  @Column({ name: 'imposed_by', type: 'uuid', nullable: true })
  imposedById: string;

  @ApiProperty({ description: '是否需要专家评审', default: false })
  @Column({ name: 'require_expert_review', type: 'boolean', default: false })
  requireExpertReview: boolean;

  @ApiProperty({ description: '状态', maxLength: 20, default: 'active' })
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
  status: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AncientBook, book => book.borrowingRestrictions)
  @JoinColumn({ name: 'book_id' })
  book: AncientBook;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'imposed_by' })
  imposedBy: User;
}
