import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RestorationRequest } from './restoration-request.entity';
import { RestorationStep } from './restoration-step.entity';
import { ExpertReview } from './expert-review.entity';

export type UserRole = 'librarian' | 'restorer' | 'expert' | 'admin';

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '用户名', maxLength: 50 })
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @ApiProperty({ description: '姓名', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: '角色', enum: ['librarian', 'restorer', 'expert', 'admin'] })
  @Column({ type: 'enum', enum: ['librarian', 'restorer', 'expert', 'admin'] })
  role: UserRole;

  @ApiProperty({ description: '邮箱', maxLength: 100, required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RestorationRequest, request => request.requestedBy)
  submittedRequests: RestorationRequest[];

  @OneToMany(() => RestorationStep, step => step.performedBy)
  performedSteps: RestorationStep[];

  @OneToMany(() => ExpertReview, review => review.reviewer)
  reviews: ExpertReview[];
}
