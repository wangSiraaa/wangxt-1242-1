import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RestorationStepService } from '../services/restoration-step.service';
import { CreateRestorationStepDto, UpdateRestorationStepDto, CompleteStepDto } from '../dto/restoration-step.dto';
import { StepType, StepStatus } from '../entities/restoration-step.entity';

@ApiTags('修复工序')
@Controller('api/restoration-steps')
export class RestorationStepController {
  constructor(private readonly stepService: RestorationStepService) {}

  @Get()
  @ApiOperation({ summary: '获取工序列表' })
  @ApiQuery({ name: 'requestId', required: true, description: '修复申请ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByRequestId(@Query('requestId') requestId: string) {
    return this.stepService.findByRequestId(requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工序详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '工序不存在' })
  async findOne(@Param('id') id: string) {
    return this.stepService.findOne(id);
  }

  @Get('types')
  @ApiOperation({ summary: '获取工序类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStepTypes(): Promise<{ type: StepType; name: string; order: number; description: string }[]> {
    return [
      { type: 'deacidification', name: '脱酸', order: 1, description: '使用碱性溶液去除纸张酸性物质，延长纸张寿命' },
      { type: 'paper_mending', name: '补纸', order: 2, description: '使用合适的补纸材料修复破损页面' },
      { type: 'binding', name: '装帧', order: 3, description: '重新装订书籍，包括线装、包角等工艺' },
    ];
  }

  @Get('statuses')
  @ApiOperation({ summary: '获取工序状态列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStepStatuses(): Promise<{ status: StepStatus; name: string }[]> {
    return [
      { status: 'pending', name: '待执行' },
      { status: 'in_progress', name: '执行中' },
      { status: 'completed', name: '已完成' },
    ];
  }

  @Post()
  @ApiOperation({ summary: '创建工序' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() dto: CreateRestorationStepDto) {
    return this.stepService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新工序' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '工序不存在' })
  async update(@Param('id') id: string, @Body() dto: UpdateRestorationStepDto) {
    return this.stepService.update(id, dto);
  }

  @Put(':id/start')
  @ApiOperation({ summary: '开始工序' })
  @ApiResponse({ status: 200, description: '开始成功' })
  @ApiResponse({ status: 400, description: '前一道工序未完成' })
  @ApiResponse({ status: 404, description: '工序不存在' })
  async startStep(@Param('id') id: string, @Body('restorerId') restorerId: string) {
    return this.stepService.startStep(id, restorerId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: '完成工序' })
  @ApiResponse({ status: 200, description: '完成成功' })
  @ApiResponse({ status: 400, description: '材料批号缺失或参数错误' })
  @ApiResponse({ status: 404, description: '工序不存在' })
  async completeStep(@Param('id') id: string, @Body() dto: CompleteStepDto) {
    return this.stepService.completeStep(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除工序' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '只能删除待执行状态的工序' })
  @ApiResponse({ status: 404, description: '工序不存在' })
  async remove(@Param('id') id: string) {
    return this.stepService.remove(id);
  }
}
