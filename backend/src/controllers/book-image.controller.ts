import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BookImageService } from '../services/book-image.service';
import { CreateBookImageDto, UpdateBookImageDto } from '../dto/book-image.dto';

@ApiTags('古籍图片')
@Controller('api/book-images')
export class BookImageController {
  constructor(private readonly imageService: BookImageService) {}

  @Get('book/:bookId')
  @ApiOperation({ summary: '获取古籍的图片列表' })
  @ApiQuery({ name: 'imageType', required: false, description: '图片类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByBookId(
    @Param('bookId') bookId: string,
    @Query('imageType') imageType?: string,
  ) {
    return this.imageService.findByBookId(bookId, imageType);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: '获取修复申请的图片列表' })
  @ApiQuery({ name: 'imageType', required: false, description: '图片类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByRequestId(
    @Param('requestId') requestId: string,
    @Query('imageType') imageType?: string,
  ) {
    return this.imageService.findByRequestId(requestId, imageType);
  }

  @Get('types')
  @ApiOperation({ summary: '获取图片类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getImageTypes() {
    return this.imageService.getImageTypes();
  }

  @Get('check/:requestId')
  @ApiOperation({ summary: '检查修复照片完整性' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async checkRestorationImages(@Param('requestId') requestId: string) {
    return this.imageService.checkRestorationImages(requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取图片详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '图片不存在' })
  async findOne(@Param('id') id: string) {
    return this.imageService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '上传图片' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() dto: CreateBookImageDto) {
    return this.imageService.create(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量上传图片' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async createBatch(@Body() dtos: CreateBookImageDto[]) {
    return this.imageService.createBatch(dtos);
  }

  @Post('restoration/:requestId')
  @ApiOperation({ summary: '上传修复前后照片' })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async uploadRestorationImages(
    @Param('requestId') requestId: string,
    @Body() body: {
      beforeImage: CreateBookImageDto;
      afterImage: CreateBookImageDto;
    },
  ) {
    return this.imageService.uploadRestorationImages(
      requestId,
      body.beforeImage,
      body.afterImage,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: '更新图片' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '图片不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateBookImageDto) {
    return this.imageService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除图片' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '图片不存在' })
  async remove(@Param('id') id: string) {
    return this.imageService.remove(id);
  }
}
