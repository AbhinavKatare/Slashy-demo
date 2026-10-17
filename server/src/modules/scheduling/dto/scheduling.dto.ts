import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScheduleDraftDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000020' })
  @IsString()
  @IsNotEmpty()
  draftId!: string;

  @ApiProperty({ example: '2026-10-15T09:00:00Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 'America/New_York', default: 'UTC' })
  @IsString()
  @IsOptional()
  timezone?: string;
}
