import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Review sales deck before customer call' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: '018f0000-0000-7000-8000-000000000020' })
  @IsString()
  @IsOptional()
  threadId?: string;

  @ApiPropertyOptional({ example: '2026-10-18T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Review sales deck before customer call' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ example: '2026-10-19T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
