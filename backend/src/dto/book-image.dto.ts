import { IsUUID, IsString, IsOptional, IsDate, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookImageDto {
  @ApiProperty({ description: '古籍ID' })
  @IsUUID()
  bookId: string;

  @ApiPropertyOptional({ description: '修复申请ID' })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiProperty({ description: '图片类型', example: 'before_restoration' })
  @IsString()
  imageType: string;

  @ApiProperty({ description: '图片URL' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: '缩略图URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '拍摄时间' })
  @IsOptional()
  @IsDate()
  takenAt?: Date;

  @ApiPropertyOptional({ description: '拍摄人ID' })
  @IsOptional()
  @IsUUID()
  takenById?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '文件大小(字节)' })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({ description: '文件格式' })
  @IsOptional()
  @IsString()
  fileFormat?: string;
}

export class UpdateBookImageDto {
  @ApiPropertyOptional({ description: '图片类型' })
  @IsOptional()
  @IsString()
  imageType?: string;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '缩略图URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
