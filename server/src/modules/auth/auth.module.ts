import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { OidcService } from '../providers/oidc.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EncryptionService, OidcService, JwtAuthGuard],
  exports: [AuthService, EncryptionService, JwtAuthGuard],
})
export class AuthModule {}
