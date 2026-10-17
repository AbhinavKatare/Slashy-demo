import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { SendingService } from './sending.service';
import { ClamAvScannerService } from '../../common/security/clamav-scanner.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [DraftsController],
  providers: [DraftsService, SendingService, ClamAvScannerService],
  exports: [DraftsService, SendingService, ClamAvScannerService],
})
export class DraftsModule {}
