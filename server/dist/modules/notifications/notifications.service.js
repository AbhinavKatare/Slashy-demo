"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    db;
    logger = new common_1.Logger(NotificationsService_1.name);
    dedupeCache = new Map();
    constructor(db) {
        this.db = db;
    }
    async registerToken(userId, dto) {
        const id = (0, uuid_1.v7)();
        const res = await this.db.query(`INSERT INTO notification_tokens (id, user_id, device_id, token, platform)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, token) DO UPDATE
       SET device_id = EXCLUDED.device_id,
           platform = EXCLUDED.platform,
           updated_at = clock_timestamp()
       RETURNING id, platform, created_at, updated_at;`, [id, userId, dto.deviceId || null, dto.token, dto.platform], userId);
        return { success: true, token: res.rows[0] };
    }
    async unregisterToken(userId, token) {
        await this.db.query(`DELETE FROM notification_tokens WHERE user_id = $1 AND token = $2;`, [userId, token], userId);
        return { success: true, message: 'Notification token unregistered' };
    }
    isWithinQuietHours(quietStart = '22:00', quietEnd = '07:00', currentTime = new Date()) {
        const currentHours = currentTime.getUTCHours();
        const currentMinutes = currentTime.getUTCMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);
        const startTotalMinutes = startH * 60 + (startM || 0);
        const endTotalMinutes = endH * 60 + (endM || 0);
        if (startTotalMinutes > endTotalMinutes) {
            return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
        }
        else {
            return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
        }
    }
    async sendNotification(userId, payload, userPreferences) {
        const collapseKey = payload.collapseKey || (payload.threadId ? `thread_${payload.threadId}` : 'default');
        const dedupeKey = `${userId}:${payload.channel}:${collapseKey}:${payload.title}`;
        const now = Date.now();
        const lastSent = this.dedupeCache.get(dedupeKey);
        if (lastSent && now - lastSent < 5 * 60 * 1000) {
            this.logger.debug(`[DEDUPE] Dropping duplicate notification for user ${userId} within 5m window: ${dedupeKey}`);
            return { status: 'dropped_duplicate', dedupeKey };
        }
        if (userPreferences?.quietHoursEnabled && !payload.isUrgent) {
            if (this.isWithinQuietHours(userPreferences.quietStart, userPreferences.quietEnd)) {
                this.logger.log(`[QUIET HOURS] Notification suppressed during quiet hours for user ${userId}`);
                return { status: 'suppressed_quiet_hours', collapseKey };
            }
        }
        this.dedupeCache.set(dedupeKey, now);
        const sanitizedTitle = payload.title;
        const sanitizedBody = payload.body || '';
        this.logger.log(`[FCM DISPATCH] Notification [${payload.channel}] dispatched to user ${userId} (collapse: ${collapseKey})`);
        return {
            status: 'dispatched',
            channel: payload.channel,
            collapseKey,
            title: sanitizedTitle,
            body: sanitizedBody,
            dispatchedAt: new Date().toISOString(),
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map