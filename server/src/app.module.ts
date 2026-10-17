import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { MailModule } from './modules/mail/mail.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { SyncModule } from './modules/sync/sync.module';
import { SearchModule } from './modules/search/search.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    AuthModule,
    AccountsModule,
    ProvidersModule,
    MailModule,
    DraftsModule,
    SchedulingModule,
    SyncModule,
    SearchModule,
    CalendarModule,
    TasksModule,
    AiModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
