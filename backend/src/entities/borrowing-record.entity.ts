import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AncientBook } from './ancient-book.entity';

@Entity('borrowing_records')
export class BorrowingRecord {
  @ApiProperty({ description: '借阅记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '古籍ID' })
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ApiProperty({ description: '借阅人', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  borrower: string;

  @ApiProperty({ description: '借阅日期' })
  @Column({ name: 'borrow_date', type: 'date' })
  borrowDate: Date;

  @ApiProperty({ description: '应还日期' })
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @ApiProperty({ description: '归还日期', required: false })
  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: Date;

  @ApiProperty({ description: '借阅目的', required: false })
  @Column({ type: 'text', nullable: true })
  purpose: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AncientBook, book => book.borrowingRecords)
  @JoinColumn({ name: 'book_id' })
  book: AncientBook;
}
