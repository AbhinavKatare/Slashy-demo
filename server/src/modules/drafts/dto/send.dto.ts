import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsISO8601,
  Matches,
} from 'class-validator';

export class SendDraftDto {
  @ApiProperty({ description: 'ID of the draft to send' })
  @IsString()
  @IsNotEmpty()
  draftId!: string;

  @ApiProperty({
    description:
      'SHA-256 hex hash of the final reviewed payload to ensure user reviewed exact content',
    example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/i, {
    message: 'payloadHash must be a valid 64-character SHA-256 hex string',
  })
  payloadHash!: string;

  @ApiPropertyOptional({
    description: 'Undo window duration in seconds (0 to 30s). Defaults to 10s',
    default: 10,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  undoWindowSeconds?: number;

  @ApiPropertyOptional({
    description: 'Scheduled send timestamp (ISO-8601 UTC)',
    example: '2026-10-15T09:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Client timezone identifier for scheduled send (e.g. "America/New_York", "UTC")',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Automatically trigger a reminder if no reply is received within N days',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  followUpIfNoReplyDays?: number;

  @ApiPropertyOptional({
    description: 'Explicit reminder timestamp for this thread (ISO-8601)',
  })
  @IsOptional()
  @IsISO8601()
  reminderAt?: string;
}

export class CancelSendDto {
  @ApiProperty({ description: 'The operation or send ID to cancel' })
  @IsString()
  @IsNotEmpty()
  sendId!: string;
}

export class UploadAttachmentDto {
  @ApiProperty({ example: 'financial_report.pdf' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ description: 'Base64 encoded binary file content' })
  @IsString()
  @IsNotEmpty()
  base64Data!: string;
}
