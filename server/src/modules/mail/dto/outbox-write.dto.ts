import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum WriteActionType {
  MARK_READ = 'mark_read',
  MARK_UNREAD = 'mark_unread',
  STAR = 'star',
  UNSTAR = 'unstar',
  ARCHIVE = 'archive',
  TRASH = 'trash',
  APPLY_LABEL = 'apply_label',
  REMOVE_LABEL = 'remove_label',
}

export class ModifyThreadActionDto {
  @ApiProperty({ enum: WriteActionType, example: WriteActionType.MARK_READ })
  @IsEnum(WriteActionType)
  action!: WriteActionType;

  @ApiPropertyOptional({ example: 'Finance' })
  @IsString()
  @IsOptional()
  labelName?: string;

  @ApiPropertyOptional({ description: 'Optimistic concurrency ETag or updated_at version token' })
  @IsString()
  @IsOptional()
  eTag?: string;
}

export class BulkModifyThreadsDto {
  @ApiProperty({ example: ['thread-1', 'thread-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  threadIds!: string[];

  @ApiProperty({ enum: WriteActionType, example: WriteActionType.ARCHIVE })
  @IsEnum(WriteActionType)
  action!: WriteActionType;

  @ApiPropertyOptional({ example: 'Receipts' })
  @IsString()
  @IsOptional()
  labelName?: string;
}
