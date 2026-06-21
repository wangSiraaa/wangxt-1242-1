import { Controller, Get, Param, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BusinessRulesService } from '../services/business-rules.service';
import { RestorationRequestService } from '../services/restoration-request.service';

@ApiTags('业务规则')
@Controller('api/business-rules')
export class BusinessRulesController {
  constructor(
    private readonly businessRulesService: BusinessRulesService,
    private readonly requestService: RestorationRequestService,
  ) {}

  @Get('validate/precious-review/:requestId')
  @ApiOperation({ summary: '验证珍贵古籍评审规则' })
  @ApiResponse({ status: 200, description: '验证通过' })
  @ApiResponse({ status: 403, description: '验证失败' })
  async validatePreciousBookReview(@Param('requestId') requestId: string) {
    try {
      const request = await this.requestService.findOne(requestId);
      await this.businessRulesService.validatePreciousBookReview(requestId, request.bookId);
      return { valid: true, message: '珍贵古籍评审规则验证通过' };
    } catch (error) {
      throw error;
    }
  }

  @Get('validate/material-batch/:stepId')
  @ApiOperation({ summary: '验证材料批号规则' })
  @ApiResponse({ status: 200, description: '验证通过' })
  @ApiResponse({ status: 400, description: '验证失败' })
  async validateMaterialBatchNumber(@Param('stepId') stepId: string) {
    try {
      await this.businessRulesService.validateMaterialBatchNumber(stepId);
      return { valid: true, message: '材料批号规则验证通过' };
    } catch (error) {
      throw error;
    }
  }

  @Get('validate/restoration-images/:requestId')
  @ApiOperation({ summary: '验证修复照片完整性规则' })
  @ApiResponse({ status: 200, description: '验证通过' })
  @ApiResponse({ status: 400, description: '验证失败' })
  async validateRestorationImages(@Param('requestId') requestId: string) {
    try {
      const request = await this.requestService.findOne(requestId);
      await this.businessRulesService.validateRestorationImages(requestId, request.bookId);
      return { valid: true, message: '修复照片完整性规则验证通过' };
    } catch (error) {
      throw error;
    }
  }

  @Get('can-open/:requestId')
  @ApiOperation({ summary: '检查是否可开放阅览' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async checkCanOpenForReading(@Param('requestId') requestId: string) {
    const request = await this.requestService.findOne(requestId);
    return this.businessRulesService.checkCanOpenForReading(requestId, request.bookId);
  }

  @Get('workflow/:requestId')
  @ApiOperation({ summary: '获取所需工作流' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRequiredWorkflow(@Param('requestId') requestId: string) {
    const request = await this.requestService.findOne(requestId);
    return this.businessRulesService.getRequiredWorkflow(request.bookId);
  }

  @Get('rules')
  @ApiOperation({ summary: '获取所有业务规则说明' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getRules() {
    return [
      {
        id: 'precious_book_review',
        name: '珍贵古籍必须专家评审',
        description: '珍贵等级为 precious 或 national_treasure 的古籍，修复完成前必须通过专家评审',
        enforcement: '数据库触发器 + 应用层双重验证',
      },
      {
        id: 'material_batch_required',
        name: '修复材料批号必填',
        description: '修复师提交工序时若漏填材料批号，可保存为待补录状态；专家评审前必须补齐批号',
        enforcement: '应用层 Service 验证 + 评审前置校验',
      },
      {
        id: 'restoration_images_required',
        name: '修复前后照片必填',
        description: '古籍重新开放阅览前，必须上传修复前后对比照片',
        enforcement: '应用层 Service 验证',
      },
      {
        id: 'step_order_enforcement',
        name: '工序顺序强制执行',
        description: '必须按脱酸→补纸→装帧顺序执行，前一道工序完成才能开始下一道',
        enforcement: '应用层 Service 验证',
      },
      {
        id: 'request_status_flow',
        name: '申请状态流转',
        description: '修复申请状态必须按预设流程流转，不能跳步',
        enforcement: '状态机验证',
      },
    ];
  }
}
