import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RestorationRequestService } from '../services/restoration-request.service';
import { CreateRestorationRequestDto, UpdateRestorationRequestDto, UpdateRequestStatusDto } from '../dto/restoration-request.dto';
import { RequestStatus } from '../entities/restoration-request.entity';

@ApiTags('修复申请')
@Controller('api/restoration-requests')
export class RestorationRequestController {
  constructor(private readonly requestService: RestorationRequestService) {}

  @Get()
  @ApiOperation({ summary: '获取修复申请列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: '申请状态' })
  @ApiQuery({ name: 'bookId', required: false, description: '古籍ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: RequestStatus,
    @Query('bookId') bookId?: string,
  ) {
    return this.requestService.findAll(+page, +limit, status, bookId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取修复申请详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async findOne(@Param('id') id: string) {
    return this.requestService.findOne(id);
  }

  @Get(':id/workflow')
  @ApiOperation({ summary: '获取流程状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async getWorkflowStatus(@Param('id') id: string) {
    return this.requestService.getWorkflowStatus(id);
  }

  @Post()
  @ApiOperation({ summary: '创建修复申请' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() dto: CreateRestorationRequestDto) {
    return this.requestService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新修复申请' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateRestorationRequestDto) {
    return this.requestService.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新申请状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '状态转换不合法' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateRequestStatusDto) {
    return this.requestService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除修复申请' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '只能删除草稿状态的申请' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async remove(@Param('id') id: string) {
    return this.requestService.remove(id);
  }
}
