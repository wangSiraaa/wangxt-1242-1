import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MaterialService } from '../services/material.service';
import { Material } from '../entities/material.entity';

@ApiTags('修复材料')
@Controller('api/materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  @ApiOperation({ summary: '获取材料列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'category', required: false, description: '材料类别' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.materialService.findAll(+page, +limit, category, keyword);
  }

  @Get('low-stock')
  @ApiOperation({ summary: '获取库存预警列表' })
  @ApiQuery({ name: 'threshold', required: false, description: '阈值', example: 10 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLowStock(@Query('threshold') threshold: number = 10) {
    return this.materialService.getLowStock(+threshold);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取材料类别列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories() {
    return this.materialService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取材料详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '材料不存在' })
  async findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Get('code/:materialCode')
  @ApiOperation({ summary: '根据编号获取材料' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '材料不存在' })
  async findByCode(@Param('materialCode') materialCode: string) {
    return this.materialService.findByCode(materialCode);
  }

  @Post()
  @ApiOperation({ summary: '创建材料' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() materialData: Partial<Material>) {
    return this.materialService.create(materialData);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新材料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '材料不存在' })
  async update(@Param('id') id: string, @Body() materialData: Partial<Material>) {
    return this.materialService.update(id, materialData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除材料' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '材料不存在' })
  async remove(@Param('id') id: string) {
    return this.materialService.remove(id);
  }
}
