import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AncientBook } from './ancient-book.entity';
import { User } from './user.entity';

@Entity('borrowing_restrictions')
export class BorrowingRestriction {
  @ApiProperty({ description: '限制ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '古籍ID' })
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ApiProperty({ description: '限制类型', maxLength: 50 })
  @Column({ name: 'restriction_type', type: 'varchar', length: 50 })
  restrictionType: string;

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

  @ApiProperty({ description: '是否生效', default: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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
