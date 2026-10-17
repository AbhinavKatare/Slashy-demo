import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ConnectProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

export enum ScopeTier {
  READONLY = 'readonly',
  MODIFY_SEND = 'modify_send',
}

export class GetConnectUrlQueryDto {
  @ApiProperty({ enum: ConnectProvider, example: 'google' })
  @IsEnum(ConnectProvider)
  provider!: ConnectProvider;

  @ApiPropertyOptional({ enum: ScopeTier, default: ScopeTier.READONLY })
  @IsEnum(ScopeTier)
  @IsOptional()
  tier?: ScopeTier;

  @ApiProperty({ example: 'inboxcompanion://oauth/callback' })
  @IsString()
  @IsNotEmpty()
  redirectUri!: string;
}

export class ConnectCallbackDto {
  @ApiProperty({ enum: ConnectProvider, example: 'google' })
  @IsEnum(ConnectProvider)
  provider!: ConnectProvider;

  @ApiProperty({ description: 'Authorization code returned by provider' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'PKCE code_verifier generated before launching auth flow' })
  @IsString()
  @IsNotEmpty()
  codeVerifier!: string;

  @ApiProperty({ description: 'State parameter for CSRF validation' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 'inboxcompanion://oauth/callback' })
  @IsString()
  @IsNotEmpty()
  redirectUri!: string;
}

export class DisconnectAccountDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Purge all cached emails, threads and drafts',
  })
  @IsOptional()
  purgeData?: boolean;
}
