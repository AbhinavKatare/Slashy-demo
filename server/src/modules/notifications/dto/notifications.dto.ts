import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterNotificationTokenDto {
  @ApiProperty({ example: 'fcm_token_xyz123' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios', 'web'] })
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform!: 'android' | 'ios' | 'web';

  @ApiPropertyOptional({ example: '018f0000-0000-7000-8000-000000000030' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class UnregisterNotificationTokenDto {
  @ApiProperty({ example: 'fcm_token_xyz123' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
