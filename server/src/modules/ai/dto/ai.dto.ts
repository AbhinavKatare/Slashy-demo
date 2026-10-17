import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SummarizeThreadDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000020' })
  @IsString()
  @IsNotEmpty()
  threadId!: string;

  @ApiPropertyOptional({
    description: 'Mask email addresses and phone numbers before AI processing',
    default: true,
  })
  @IsOptional()
  redactPii?: boolean;
}

export class GenerateReplyDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000020' })
  @IsString()
  @IsNotEmpty()
  threadId!: string;

  @ApiPropertyOptional({
    example: 'professional',
    enum: ['professional', 'friendly', 'concise', 'casual'],
    default: 'professional',
  })
  @IsString()
  @IsOptional()
  @IsIn(['professional', 'friendly', 'concise', 'casual'])
  tone?: 'professional' | 'friendly' | 'concise' | 'casual';

  @ApiPropertyOptional({ example: 'Confirm availability for Friday at 2 PM' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  userPrompt?: string;

  @ApiPropertyOptional({
    description: 'Mask email addresses and phone numbers before AI processing',
    default: true,
  })
  @IsOptional()
  redactPii?: boolean;
}

export class AdjustToneDto {
  @ApiProperty({ example: 'Please send me the report ASAP.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text!: string;

  @ApiProperty({
    example: 'friendly',
    enum: ['professional', 'friendly', 'concise', 'casual'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['professional', 'friendly', 'concise', 'casual'])
  targetTone!: 'professional' | 'friendly' | 'concise' | 'casual';
}

export class TranscribeAssistDto {
  @ApiProperty({
    description: 'Raw transcribed voice dictation text to convert into an email draft',
    example:
      'hey Alex let us meet next Tuesday around two pm to go over the budget and slides thanks',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  rawDictation!: string;

  @ApiPropertyOptional({
    example: 'professional',
    enum: ['professional', 'friendly', 'concise', 'casual'],
    default: 'professional',
  })
  @IsOptional()
  @IsIn(['professional', 'friendly', 'concise', 'casual'])
  tone?: 'professional' | 'friendly' | 'concise' | 'casual';
}
