import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RecipientDto } from '../../mail/dto/mail.dto';

export class CreateDraftDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000010' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  replyThreadId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  replyMessageId?: string;

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  toRecipients?: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  ccRecipients?: RecipientDto[];

  @ApiPropertyOptional({ type: [RecipientDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  bccRecipients?: RecipientDto[];

  @ApiPropertyOptional({ example: 'Quarterly Planning' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ example: 'Here are the draft notes...' })
  @IsString()
  @IsOptional()
  bodyPlain?: string;

  @ApiPropertyOptional({ example: '<p>Here are the draft notes...</p>' })
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @ApiPropertyOptional({ example: [] })
  @IsArray()
  @IsOptional()
  attachmentsMeta?: any[];
}

export class UpdateDraftDto extends CreateDraftDto {}
