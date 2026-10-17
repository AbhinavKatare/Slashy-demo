import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCalendarEventDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: 'Product Sync & Design Review' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Discuss Q4 roadmap and design iterations' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Conference Room B / Virtual' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @IsOptional()
  joinUrl?: string;

  @ApiProperty({ example: '2026-10-15T14:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-10-15T15:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({ example: ['alex@example.com', 'taylor@example.com'] })
  @IsArray()
  @IsOptional()
  attendees?: string[];
}

export class ListEventsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  start?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  end?: string;

  @ApiPropertyOptional({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsOptional()
  accountId?: string;
}
