import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { OAuthConnectService } from './oauth-connect.service';
import { EnvelopeEncryptionService } from '../../common/crypto/envelope-encryption.service';
import { LocalKmsService } from '../../common/crypto/kms/local-kms.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, OAuthConnectService, EnvelopeEncryptionService, LocalKmsService],
  exports: [AccountsService, OAuthConnectService, EnvelopeEncryptionService],
})
export class AccountsModule {}
