import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export class OidcLoginDto {
  @ApiProperty({ enum: AuthProvider, example: 'google' })
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @ApiProperty({
    description: 'OIDC Identity Token issued by provider',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiPropertyOptional({ example: "Alex's Pixel 9 Pro" })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'android' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsString()
  @IsOptional()
  appVersion?: string;

  @ApiPropertyOptional({ example: 'fcm_push_token_xyz' })
  @IsString()
  @IsOptional()
  pushToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Active rotating refresh token', example: 'eyJhbGciOiJIUzI1Ni...' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthTokensResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1Ni...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1Ni...' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access token expiration in seconds (15 minutes)' })
  expiresIn!: number;

  @ApiProperty({
    example: {
      id: '018f0000-0000-7000-8000-000000000001',
      email: 'alex.morgan@example.com',
      displayName: 'Alex Morgan',
    },
  })
  user!: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export class SessionResponseDto {
  @ApiProperty({ example: '018f0000-0000-7000-8000-000000000030' })
  id!: string;

  @ApiPropertyOptional({ example: "Alex's Pixel 9 Pro" })
  deviceName?: string;

  @ApiPropertyOptional({ example: 'android' })
  platform?: string;

  @ApiPropertyOptional({ example: '192.168.1.100' })
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'InboxCompanion/1.0.0 (Android 14)' })
  userAgent?: string;

  @ApiProperty({ example: '2026-10-13T12:00:00Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-13T12:30:00Z' })
  lastActiveAt!: string;

  @ApiProperty({ example: true })
  isCurrent!: boolean;
}
