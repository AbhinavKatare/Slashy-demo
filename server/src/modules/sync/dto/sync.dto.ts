import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OutboxItemDto {
  @ApiProperty({ example: 'op-018f0000-0000-7000' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({
    example: 'mark_read',
    enum: ['mark_read', 'mark_unread', 'star', 'unstar', 'archive', 'trash'],
  })
  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000020' })
  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @ApiPropertyOptional({ example: {} })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}

export class PushOutboxBatchDto {
  @ApiProperty({ type: [OutboxItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboxItemDto)
  operations!: OutboxItemDto[];
}

export class PullDeltaQueryDto {
  @ApiPropertyOptional({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: '2026-10-13T12:00:00.000Z' })
  @IsString()
  @IsOptional()
  cursor?: string;
}
