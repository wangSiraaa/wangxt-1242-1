import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: string,
    keyword?: string,
  ): Promise<{
    data: Material[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.materialRepository.createQueryBuilder('material');

    if (type) {
      query.andWhere('material.type = :type', { type });
    }
    if (keyword) {
      query.andWhere('(material.name LIKE :keyword OR material.materialCode LIKE :keyword OR material.batchNumber LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    query.orderBy('material.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['usedInSteps'],
    });
    if (!material) {
      throw new NotFoundException('材料不存在');
    }
    return material;
  }

  async findByCode(materialCode: string): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { materialCode } });
    if (!material) {
      throw new NotFoundException('材料不存在');
    }
    return material;
  }

  async create(materialData: Partial<Material>): Promise<Material> {
    const existing = await this.materialRepository.findOne({ where: { materialCode: materialData.materialCode } });
    if (existing) {
      throw new BadRequestException('材料编号已存在');
    }

    if (!materialData.batchNumber || materialData.batchNumber.trim() === '') {
      throw new BadRequestException('材料批号不能为空');
    }

    const material = this.materialRepository.create(materialData);
    return this.materialRepository.save(material);
  }

  async update(id: string, materialData: Partial<Material>): Promise<Material> {
    const material = await this.findOne(id);
    
    if (materialData.materialCode && materialData.materialCode !== material.materialCode) {
      const existing = await this.materialRepository.findOne({ where: { materialCode: materialData.materialCode } });
      if (existing) {
        throw new BadRequestException('材料编号已存在');
      }
    }

    if (materialData.batchNumber !== undefined && 
        materialData.batchNumber !== null && 
        materialData.batchNumber.trim() === '') {
      throw new BadRequestException('材料批号不能为空');
    }

    Object.assign(material, materialData);
    return this.materialRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    
    if (material.usedInSteps && material.usedInSteps.length > 0) {
      throw new BadRequestException('该材料已在修复工序中使用，无法删除');
    }

    await this.materialRepository.delete(id);
  }

  async getTypes(): Promise<string[]> {
    const result = await this.materialRepository
      .createQueryBuilder('material')
      .select('DISTINCT material.type', 'type')
      .where('material.type IS NOT NULL')
      .getRawMany();
    
    return result.map(r => r.type);
  }

  async getLowStock(threshold: number = 10): Promise<Material[]> {
    return this.materialRepository.find({
      where: { quantity: () => `quantity <= ${threshold}` },
      order: { quantity: 'ASC' },
    });
  }

  async adjustQuantity(id: string, quantity: number): Promise<Material> {
    const material = await this.findOne(id);
    material.quantity = Math.max(0, quantity);
    return this.materialRepository.save(material);
  }
}
