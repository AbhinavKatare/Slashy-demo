import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecipientDto {
  @ApiProperty({ example: 'Alex Morgan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;
}

export class ListThreadsQueryDto {
  @ApiPropertyOptional({ example: 'inbox' })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  labelId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isUnread?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class UpdateThreadDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isUnread?: boolean;

  @ApiPropertyOptional({ example: 'archive' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ type: [RecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  to!: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  cc?: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  bcc?: RecipientDto[];

  @ApiProperty({ example: 'Project Update' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Hello team, here is the latest update.' })
  @IsString()
  @IsNotEmpty()
  bodyPlain!: string;

  @ApiPropertyOptional({ example: '<p>Hello team, here is the latest update.</p>' })
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  replyToThreadId?: string;
}

export class CreateLabelDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: 'Finance' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '#10B981' })
  @IsString()
  @IsNotEmpty()
  colorHex!: string;
}
