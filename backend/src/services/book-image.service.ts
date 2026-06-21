import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BookImage, ImageType } from '../entities/book-image.entity';
import { RestorationRequest } from '../entities/restoration-request.entity';
import { CreateBookImageDto, UpdateBookImageDto } from '../dto/book-image.dto';

@Injectable()
export class BookImageService {
  constructor(
    @InjectRepository(BookImage)
    private readonly imageRepository: Repository<BookImage>,
    @InjectRepository(RestorationRequest)
    private readonly requestRepository: Repository<RestorationRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async findByBookId(bookId: string, imageType?: string): Promise<BookImage[]> {
    const query = this.imageRepository.createQueryBuilder('image')
      .leftJoinAndSelect('image.takenBy', 'takenBy')
      .where('image.bookId = :bookId', { bookId });

    if (imageType) {
      query.andWhere('image.imageType = :imageType', { imageType });
    }

    return query.orderBy('image.createdAt', 'DESC').getMany();
  }

  async findByRequestId(requestId: string, imageType?: string): Promise<BookImage[]> {
    const query = this.imageRepository.createQueryBuilder('image')
      .leftJoinAndSelect('image.takenBy', 'takenBy')
      .where('image.requestId = :requestId', { requestId });

    if (imageType) {
      query.andWhere('image.imageType = :imageType', { imageType });
    }

    return query.orderBy('image.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<BookImage> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: ['book', 'request', 'takenBy'],
    });
    if (!image) {
      throw new NotFoundException('图片不存在');
    }
    return image;
  }

  async create(dto: CreateBookImageDto): Promise<BookImage> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.requestId) {
        const request = await manager.findOne(RestorationRequest, { where: { id: dto.requestId } });
        if (!request) {
          throw new NotFoundException('修复申请不存在');
        }
      }

      const image = manager.create(BookImage, {
        ...dto,
        imageType: dto.imageType as ImageType,
        takenAt: dto.takenAt || new Date(),
      });

      return manager.save(image);
    });
  }

  async createBatch(dtos: CreateBookImageDto[]): Promise<BookImage[]> {
    return this.dataSource.transaction(async (manager) => {
      const images: BookImage[] = [];
      
      for (const dto of dtos) {
        if (dto.requestId) {
          const request = await manager.findOne(RestorationRequest, { where: { id: dto.requestId } });
          if (!request) {
            throw new NotFoundException('修复申请不存在');
          }
        }

        const image = manager.create(BookImage, {
          ...dto,
          imageType: dto.imageType as ImageType,
          takenAt: dto.takenAt || new Date(),
        });
        
        images.push(await manager.save(image));
      }

      return images;
    });
  }

  async update(id: string, dto: UpdateBookImageDto): Promise<BookImage> {
    const image = await this.findOne(id);
    Object.assign(image, dto);
    return this.imageRepository.save(image);
  }

  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);
    await this.imageRepository.delete(id);
  }

  async getImageTypes(): Promise<{ type: string; name: string; description: string }[]> {
    return [
      { type: 'before_restoration', name: '修复前照片', description: '修复工作开始前拍摄的照片' },
      { type: 'after_restoration', name: '修复后照片', description: '修复工作完成后拍摄的照片' },
      { type: 'during_restoration', name: '修复中照片', description: '修复过程中拍摄的照片' },
      { type: 'detail', name: '细节照片', description: '破损细节、材质等特写照片' },
      { type: 'cover', name: '封面照片', description: '书籍封面照片' },
    ];
  }

  async checkRestorationImages(requestId: string): Promise<{
    hasBefore: boolean;
    hasAfter: boolean;
    beforeImage: BookImage | null;
    afterImage: BookImage | null;
    allImages: BookImage[];
  }> {
    const images = await this.findByRequestId(requestId);
    const beforeImage = images.find(img => img.imageType === 'before_restoration') || null;
    const afterImage = images.find(img => img.imageType === 'after_restoration') || null;

    return {
      hasBefore: !!beforeImage,
      hasAfter: !!afterImage,
      beforeImage,
      afterImage,
      allImages: images,
    };
  }

  async uploadRestorationImages(
    requestId: string,
    beforeImage: CreateBookImageDto,
    afterImage: CreateBookImageDto,
  ): Promise<{
    beforeImage: BookImage;
    afterImage: BookImage;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RestorationRequest, { where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('修复申请不存在');
      }

      const existingBefore = await manager.findOne(BookImage, {
        where: { requestId, imageType: 'before_restoration' },
      });
      
      const existingAfter = await manager.findOne(BookImage, {
        where: { requestId, imageType: 'after_restoration' },
      });

      if (existingBefore || existingAfter) {
        throw new BadRequestException('该修复申请的修复照片已存在，如需修改请删除后重新上传');
      }

      const before = manager.create(BookImage, {
        ...beforeImage,
        requestId,
        bookId: request.bookId,
        imageType: 'before_restoration',
        takenAt: beforeImage.takenAt || new Date(),
      });

      const after = manager.create(BookImage, {
        ...afterImage,
        requestId,
        bookId: request.bookId,
        imageType: 'after_restoration',
        takenAt: afterImage.takenAt || new Date(),
      });

      const [savedBefore, savedAfter] = await Promise.all([
        manager.save(before),
        manager.save(after),
      ]);

      return {
        beforeImage: savedBefore,
        afterImage: savedAfter,
      };
    });
  }
}
