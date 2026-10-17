import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { OutboxWriteService } from './outbox-write.service';
import { MailProviderFactory } from './adapters/mail-provider.factory';
import { EnvelopeEncryptionService } from '../../common/crypto/envelope-encryption.service';
import { LocalKmsService } from '../../common/crypto/kms/local-kms.service';

@Module({
  controllers: [MailController],
  providers: [
    MailService,
    OutboxWriteService,
    MailProviderFactory,
    EnvelopeEncryptionService,
    LocalKmsService,
  ],
  exports: [MailService, OutboxWriteService, MailProviderFactory],
})
export class MailModule {}
