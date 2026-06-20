import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AncientBookService } from '../services/ancient-book.service';
import { AncientBook, RarityLevel, BorrowingStatus } from '../entities/ancient-book.entity';

@ApiTags('古籍档案')
@Controller('api/books')
export class AncientBookController {
  constructor(private readonly ancientBookService: AncientBookService) {}

  @Get()
  @ApiOperation({ summary: '获取古籍列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'rarityLevel', required: false, description: '珍贵等级' })
  @ApiQuery({ name: 'status', required: false, description: '借阅状态' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('rarityLevel') rarityLevel?: RarityLevel,
    @Query('status') status?: BorrowingStatus,
    @Query('keyword') keyword?: string,
  ) {
    return this.ancientBookService.findAll(+page, +limit, rarityLevel, status, keyword);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取古籍统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats() {
    return this.ancientBookService.getStats();
  }

  @Get('rarity-levels')
  @ApiOperation({ summary: '获取珍贵等级列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRarityLevels() {
    return this.ancientBookService.getRarityLevels();
  }

  @Get('borrowing-statuses')
  @ApiOperation({ summary: '获取借阅状态列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBorrowingStatuses() {
    return this.ancientBookService.getBorrowingStatuses();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取古籍详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '古籍不存在' })
  async findOne(@Param('id') id: string) {
    return this.ancientBookService.findOne(id);
  }

  @Get('code/:bookCode')
  @ApiOperation({ summary: '根据编号获取古籍' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '古籍不存在' })
  async findByCode(@Param('bookCode') bookCode: string) {
    return this.ancientBookService.findByCode(bookCode);
  }

  @Post()
  @ApiOperation({ summary: '创建古籍档案' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() bookData: Partial<AncientBook>) {
    return this.ancientBookService.create(bookData);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新古籍档案' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '古籍不存在' })
  async update(@Param('id') id: string, @Body() bookData: Partial<AncientBook>) {
    return this.ancientBookService.update(id, bookData);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新古籍借阅状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '古籍不存在' })
  async updateStatus(@Param('id') id: string, @Body('status') status: BorrowingStatus) {
    return this.ancientBookService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除古籍档案' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '存在未完成的修复申请' })
  @ApiResponse({ status: 404, description: '古籍不存在' })
  async remove(@Param('id') id: string) {
    return this.ancientBookService.remove(id);
  }
}
