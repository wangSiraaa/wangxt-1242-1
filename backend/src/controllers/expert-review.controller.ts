import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExpertReviewService } from '../services/expert-review.service';
import { CreateExpertReviewDto, UpdateExpertReviewDto } from '../dto/expert-review.dto';
import { ReviewDecision } from '../entities/expert-review.entity';

@ApiTags('专家评审')
@Controller('api/expert-reviews')
export class ExpertReviewController {
  constructor(private readonly reviewService: ExpertReviewService) {}

  @Get()
  @ApiOperation({ summary: '获取评审列表' })
  @ApiQuery({ name: 'requestId', required: false, description: '修复申请ID' })
  @ApiQuery({ name: 'expertId', required: false, description: '专家ID' })
  @ApiQuery({ name: 'decision', required: false, description: '评审结果' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('requestId') requestId?: string,
    @Query('expertId') expertId?: string,
    @Query('decision') decision?: ReviewDecision,
  ) {
    return this.reviewService.findAll(1, 100, requestId, expertId, decision);
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待评审列表' })
  @ApiQuery({ name: 'expertId', required: false, description: '专家ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingReviews(@Query('expertId') expertId?: string) {
    return this.reviewService.getPendingReviews(expertId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评审详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '评审不存在' })
  async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建评审' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或资格不具备' })
  async create(@Body() dto: CreateExpertReviewDto) {
    return this.reviewService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新评审' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '评审不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpertReviewDto) {
    return this.reviewService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除评审' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '评审不存在' })
  async remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
