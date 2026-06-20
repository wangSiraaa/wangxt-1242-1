import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RestorationRequest } from './restoration-request.entity';
import { User } from './user.entity';
import { Material } from './material.entity';

export type StepType = 'deacidification' | 'paper_mending' | 'binding';
export type StepStatus = 'pending' | 'in_progress' | 'completed';

@Entity('restoration_steps')
@Unique(['requestId', 'stepType'])
export class RestorationStep {
  @ApiProperty({ description: '工序ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '修复申请ID' })
  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @ApiProperty({ description: '工序类型', enum: ['deacidification', 'paper_mending', 'binding'] })
  @Column({ name: 'step_type', type: 'enum', enum: ['deacidification', 'paper_mending', 'binding'] })
  stepType: StepType;

  @ApiProperty({ description: '工序顺序' })
  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @ApiProperty({ 
    description: '工序状态', 
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  })
  @Column({ type: 'enum', enum: ['pending', 'in_progress', 'completed'], default: 'pending' })
  status: StepStatus;

  @ApiProperty({ description: '执行人ID', required: false })
  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedById: string;

  @ApiProperty({ description: '使用材料ID', required: false })
  @Column({ name: 'material_id', type: 'uuid', nullable: true })
  materialId: string;

  @ApiProperty({ description: '开始时间', required: false })
  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @ApiProperty({ description: '结束时间', required: false })
  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @ApiProperty({ description: '备注', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RestorationRequest, request => request.steps)
  @JoinColumn({ name: 'request_id' })
  request: RestorationRequest;

  @ManyToOne(() => User, user => user.performedSteps)
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;

  @ManyToOne(() => Material, material => material.usedInSteps)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  get displayName(): string {
    const names: Record<StepType, string> = {
      deacidification: '脱酸',
      paper_mending: '补纸',
      binding: '装帧'
    };
    return names[this.stepType] || this.stepType;
  }

  get canComplete(): boolean {
    if (this.materialId && this.material) {
      return this.material.hasValidBatchNumber;
    }
    return true;
  }
}
