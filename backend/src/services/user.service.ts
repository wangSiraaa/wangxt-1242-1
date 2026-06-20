import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole): Promise<User[]> {
    const options: any = {};
    if (role) {
      options.where = { role };
    }
    return this.userRepository.find(options);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { username: userData.username } });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    if (userData.username && userData.username !== user.username) {
      const existing = await this.userRepository.findOne({ where: { username: userData.username } });
      if (existing) {
        throw new BadRequestException('用户名已存在');
      }
    }

    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.delete(id);
  }

  async getByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async getRoles(): Promise<{ role: UserRole; name: string; description: string }[]> {
    return [
      { role: 'librarian', name: '馆员', description: '负责提交修复申请、借阅管理' },
      { role: 'restorer', name: '修复师', description: '负责执行修复工序' },
      { role: 'expert', name: '专家', description: '负责珍贵古籍的评审' },
      { role: 'admin', name: '管理员', description: '系统管理员' },
    ];
  }

  async getLibrarians(): Promise<User[]> {
    return this.getByRole('librarian');
  }

  async getRestorers(): Promise<User[]> {
    return this.getByRole('restorer');
  }

  async getExperts(): Promise<User[]> {
    return this.getByRole('expert');
  }
}
