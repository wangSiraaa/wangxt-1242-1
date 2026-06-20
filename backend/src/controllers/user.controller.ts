import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('用户管理')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'role', required: false, description: '用户角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query('role') role?: UserRole) {
    return this.userService.findAll(role);
  }

  @Get('roles')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRoles() {
    return this.userService.getRoles();
  }

  @Get('librarians')
  @ApiOperation({ summary: '获取馆员列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLibrarians() {
    return this.userService.getLibrarians();
  }

  @Get('restorers')
  @ApiOperation({ summary: '获取修复师列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRestorers() {
    return this.userService.getRestorers();
  }

  @Get('experts')
  @ApiOperation({ summary: '获取专家列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getExperts() {
    return this.userService.getExperts();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: '根据用户名获取用户' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() userData: Partial<User>) {
    return this.userService.create(userData);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(@Param('id') id: string, @Body() userData: Partial<User>) {
    return this.userService.update(id, userData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
