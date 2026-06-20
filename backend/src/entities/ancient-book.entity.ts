import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RestorationRequest } from './restoration-request.entity';
import { BookImage } from './book-image.entity';
import { BorrowingRestriction } from './borrowing-restriction.entity';
import { BorrowingRecord } from './borrowing-record.entity';

export type RarityLevel = 'common' | 'rare' | 'precious' | 'national_treasure';
export type BorrowingStatus = 'available' | 'restricted' | 'under_restoration' | 'permanently_restricted';

@Entity('ancient_books')
export class AncientBook {
  @ApiProperty({ description: '古籍ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '古籍编号', maxLength: 50 })
  @Column({ name: 'book_code', type: 'varchar', length: 50, unique: true })
  bookCode: string;

  @ApiProperty({ description: '书名', maxLength: 200 })
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({ description: '作者', maxLength: 100, required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @ApiProperty({ description: '朝代', maxLength: 50, required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  dynasty: string;

  @ApiProperty({ description: '出版年份', maxLength: 20, required: false })
  @Column({ name: 'publication_year', type: 'varchar', length: 20, nullable: true })
  publicationYear: string;

  @ApiProperty({ 
    description: '珍贵等级', 
    enum: ['common', 'rare', 'precious', 'national_treasure'],
    default: 'common'
  })
  @Column({ name: 'rarity_level', type: 'enum', enum: ['common', 'rare', 'precious', 'national_treasure'], default: 'common' })
  rarityLevel: RarityLevel;

  @ApiProperty({ description: '描述', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ 
    description: '当前状态', 
    enum: ['available', 'restricted', 'under_restoration', 'permanently_restricted'],
    default: 'available'
  })
  @Column({ name: 'current_status', type: 'enum', enum: ['available', 'restricted', 'under_restoration', 'permanently_restricted'], default: 'available' })
  currentStatus: BorrowingStatus;

  @ApiProperty({ description: '馆藏位置', maxLength: 100, required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RestorationRequest, request => request.book)
  restorationRequests: RestorationRequest[];

  @OneToMany(() => BookImage, image => image.book)
  images: BookImage[];

  @OneToMany(() => BorrowingRestriction, restriction => restriction.book)
  borrowingRestrictions: BorrowingRestriction[];

  @OneToMany(() => BorrowingRecord, record => record.book)
  borrowingRecords: BorrowingRecord[];

  get isPrecious(): boolean {
    return this.rarityLevel === 'precious' || this.rarityLevel === 'national_treasure';
  }
}
