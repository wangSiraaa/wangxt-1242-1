import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AncientBook, RarityLevel, BorrowingStatus } from '../entities/ancient-book.entity';
import { BusinessRulesService } from './business-rules.service';

@Injectable()
export class AncientBookService {
  constructor(
    @InjectRepository(AncientBook)
    private readonly bookRepository: Repository<AncientBook>,
    private readonly businessRulesService: BusinessRulesService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    rarityLevel?: RarityLevel,
    status?: BorrowingStatus,
    keyword?: string,
  ): Promise<{
    data: AncientBook[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.bookRepository.createQueryBuilder('book');

    if (rarityLevel) {
      query.andWhere('book.rarityLevel = :rarityLevel', { rarityLevel });
    }
    if (status) {
      query.andWhere('book.currentStatus = :status', { status });
    }
    if (keyword) {
      query.andWhere('(book.title LIKE :keyword OR book.author LIKE :keyword OR book.bookCode LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    query.orderBy('book.rarityLevel', 'DESC')
      .addOrderBy('book.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AncientBook> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: ['restorationRequests', 'images', 'borrowingRecords', 'borrowingRestrictions'],
    });
    if (!book) {
      throw new NotFoundException('古籍不存在');
    }
    return book;
  }

  async findByCode(bookCode: string): Promise<AncientBook> {
    const book = await this.bookRepository.findOne({ where: { bookCode } });
    if (!book) {
      throw new NotFoundException('古籍不存在');
    }
    return book;
  }

  async create(bookData: Partial<AncientBook>): Promise<AncientBook> {
    const existing = await this.bookRepository.findOne({ where: { bookCode: bookData.bookCode } });
    if (existing) {
      throw new BadRequestException('古籍编号已存在');
    }

    const book = this.bookRepository.create(bookData);
    return this.bookRepository.save(book);
  }

  async update(id: string, bookData: Partial<AncientBook>): Promise<AncientBook> {
    const book = await this.findOne(id);
    
    if (bookData.bookCode && bookData.bookCode !== book.bookCode) {
      const existing = await this.bookRepository.findOne({ where: { bookCode: bookData.bookCode } });
      if (existing) {
        throw new BadRequestException('古籍编号已存在');
      }
    }

    Object.assign(book, bookData);
    return this.bookRepository.save(book);
  }

  async updateStatus(id: string, status: BorrowingStatus): Promise<AncientBook> {
    const book = await this.findOne(id);
    book.currentStatus = status;
    return this.bookRepository.save(book);
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);
    
    const activeRequests = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.restorationRequests', 'request')
      .where('book.id = :id', { id })
      .andWhere("request.status NOT IN ('completed', 'cancelled')")
      .getCount();

    if (activeRequests > 0) {
      throw new BadRequestException('该古籍存在未完成的修复申请，无法删除');
    }

    await this.bookRepository.delete(id);
  }

  async getRarityLevels(): Promise<{ level: RarityLevel; name: string; color: string }[]> {
    return [
      { level: 'common', name: '普通', color: '#6b7280' },
      { level: 'rare', name: '珍贵', color: '#3b82f6' },
      { level: 'precious', name: '三级文物', color: '#f59e0b' },
      { level: 'national_treasure', name: '国宝级', color: '#ef4444' },
    ];
  }

  async getBorrowingStatuses(): Promise<{ status: BorrowingStatus; name: string; color: string }[]> {
    return [
      { status: 'available', name: '可阅览', color: '#10b981' },
      { status: 'restricted', name: '限制阅览', color: '#f59e0b' },
      { status: 'under_restoration', name: '修复中', color: '#3b82f6' },
      { status: 'permanently_restricted', name: '永久限制', color: '#ef4444' },
    ];
  }

  async getStats(): Promise<{
    total: number;
    byRarity: Record<RarityLevel, number>;
    byStatus: Record<BorrowingStatus, number>;
    underRestoration: number;
  }> {
    const total = await this.bookRepository.count();
    
    const byRarity = await this.bookRepository
      .createQueryBuilder('book')
      .select('book.rarityLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('book.rarityLevel')
      .getRawMany();

    const byStatus = await this.bookRepository
      .createQueryBuilder('book')
      .select('book.currentStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('book.currentStatus')
      .getRawMany();

    const underRestoration = await this.bookRepository.count({
      where: { currentStatus: 'under_restoration' },
    });

    const rarityCounts: Record<RarityLevel, number> = {
      common: 0,
      rare: 0,
      precious: 0,
      national_treasure: 0,
    };
    byRarity.forEach(item => {
      rarityCounts[item.level] = parseInt(item.count, 10);
    });

    const statusCounts: Record<BorrowingStatus, number> = {
      available: 0,
      restricted: 0,
      under_restoration: 0,
      permanently_restricted: 0,
    };
    byStatus.forEach(item => {
      statusCounts[item.status] = parseInt(item.count, 10);
    });

    return {
      total,
      byRarity: rarityCounts,
      byStatus: statusCounts,
      underRestoration,
    };
  }
}
