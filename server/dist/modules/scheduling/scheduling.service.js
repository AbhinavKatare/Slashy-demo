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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let SchedulingService = class SchedulingService {
    db;
    constructor(db) {
        this.db = db;
    }
    async scheduleDraft(userId, dto) {
        const scheduledDate = new Date(dto.scheduledAt);
        if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('scheduledAt must be a valid timestamp in the future');
        }
        const draftRes = await this.db.query(`SELECT id FROM drafts WHERE id = $1 AND user_id = $2;`, [dto.draftId, userId], userId);
        if (!draftRes.rows[0]) {
            throw new common_1.NotFoundException(`Draft ${dto.draftId} not found`);
        }
        const id = (0, uuid_1.v7)();
        const res = await this.db.query(`INSERT INTO scheduled_messages (id, user_id, account_id, draft_id, scheduled_at, timezone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, scheduled_at, timezone, status, created_at;`, [id, userId, dto.accountId, dto.draftId, scheduledDate.toISOString(), dto.timezone || 'UTC'], userId);
        return res.rows[0];
    }
    async listScheduled(userId) {
        const res = await this.db.query(`SELECT sm.id, sm.account_id, sm.draft_id, sm.scheduled_at, sm.timezone, sm.status,
              d.subject, d.to_recipients
       FROM scheduled_messages sm
       LEFT JOIN drafts d ON sm.draft_id = d.id
       WHERE sm.user_id = $1 AND sm.status = 'pending'
       ORDER BY sm.scheduled_at ASC;`, [userId], userId);
        return res.rows.map((r) => ({
            id: r.id,
            accountId: r.account_id,
            draftId: r.draft_id,
            subject: r.subject || '',
            toRecipients: r.to_recipients || [],
            scheduledAt: r.scheduled_at.toISOString(),
            timezone: r.timezone,
            status: r.status,
        }));
    }
    async cancelScheduled(userId, id) {
        const res = await this.db.query(`UPDATE scheduled_messages
       SET status = 'cancelled', updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id;`, [id, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Scheduled message ${id} not found or already dispatched`);
        }
        return { success: true, message: 'Scheduled send cancelled' };
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SchedulingService);
//# sourceMappingURL=scheduling.service.js.map