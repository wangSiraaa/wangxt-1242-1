import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RestorationStep } from './restoration-step.entity';

@Entity('materials')
export class Material {
  @ApiProperty({ description: '材料ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '材料编号', maxLength: 50 })
  @Column({ name: 'material_code', type: 'varchar', length: 50, unique: true })
  materialCode: string;

  @ApiProperty({ description: '材料名称', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: '批次号', maxLength: 100 })
  @Column({ name: 'batch_number', type: 'varchar', length: 100 })
  batchNumber: string;

  @ApiProperty({ description: '材料类型', maxLength: 50, required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string;

  @ApiProperty({ description: '供应商', maxLength: 100, required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  supplier: string;

  @ApiProperty({ description: '过期日期', required: false })
  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date;

  @ApiProperty({ description: '数量', default: 0 })
  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @ApiProperty({ description: '单位', maxLength: 20, required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RestorationStep, step => step.material)
  usedInSteps: RestorationStep[];

  get hasValidBatchNumber(): boolean {
    return this.batchNumber !== null && this.batchNumber.trim() !== '';
  }
}
