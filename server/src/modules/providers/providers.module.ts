import { Global, Module } from '@nestjs/common';
import { OidcService } from './oidc.service';

@Global()
@Module({
  providers: [OidcService],
  exports: [OidcService],
})
export class ProvidersModule {}
