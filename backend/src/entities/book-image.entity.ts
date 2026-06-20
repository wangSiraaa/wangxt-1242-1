import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AncientBook } from './ancient-book.entity';
import { RestorationRequest } from './restoration-request.entity';
import { User } from './user.entity';

@Entity('book_images')
export class BookImage {
  @ApiProperty({ description: '图片ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '古籍ID' })
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ApiProperty({ description: '修复申请ID', required: false })
  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId: string;

  @ApiProperty({ description: '图片类型', maxLength: 50 })
  @Column({ name: 'image_type', type: 'varchar', length: 50 })
  imageType: string;

  @ApiProperty({ description: '图片URL', maxLength: 500 })
  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @ApiProperty({ description: '缩略图URL', maxLength: 500, required: false })
  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @ApiProperty({ description: '拍摄时间', required: false })
  @Column({ name: 'taken_at', type: 'timestamp', nullable: true })
  takenAt: Date;

  @ApiProperty({ description: '拍摄人ID', required: false })
  @Column({ name: 'taken_by', type: 'uuid', nullable: true })
  takenById: string;

  @ApiProperty({ description: '描述', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '文件大小(字节)', required: false })
  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number;

  @ApiProperty({ description: '文件格式', maxLength: 20, required: false })
  @Column({ name: 'file_format', type: 'varchar', length: 20, nullable: true })
  fileFormat: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AncientBook, book => book.images)
  @JoinColumn({ name: 'book_id' })
  book: AncientBook;

  @ManyToOne(() => RestorationRequest, request => request.images)
  @JoinColumn({ name: 'request_id' })
  request: RestorationRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'taken_by' })
  takenBy: User;
}
