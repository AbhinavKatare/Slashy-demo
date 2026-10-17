"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("./database/database.module");
const redis_module_1 = require("./common/redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const accounts_module_1 = require("./modules/accounts/accounts.module");
const providers_module_1 = require("./modules/providers/providers.module");
const mail_module_1 = require("./modules/mail/mail.module");
const drafts_module_1 = require("./modules/drafts/drafts.module");
const scheduling_module_1 = require("./modules/scheduling/scheduling.module");
const sync_module_1 = require("./modules/sync/sync.module");
const search_module_1 = require("./modules/search/search.module");
const calendar_module_1 = require("./modules/calendar/calendar.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const ai_module_1 = require("./modules/ai/ai.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            accounts_module_1.AccountsModule,
            providers_module_1.ProvidersModule,
            mail_module_1.MailModule,
            drafts_module_1.DraftsModule,
            scheduling_module_1.SchedulingModule,
            sync_module_1.SyncModule,
            search_module_1.SearchModule,
            calendar_module_1.CalendarModule,
            tasks_module_1.TasksModule,
            ai_module_1.AiModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map