import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AnthropicAiProvider } from './providers/anthropic-ai.provider';

@Module({
  controllers: [AiController],
  providers: [AiService, MockAiProvider, AnthropicAiProvider],
  exports: [AiService, MockAiProvider, AnthropicAiProvider],
})
export class AiModule {}
