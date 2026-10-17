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
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let CalendarService = CalendarService_1 = class CalendarService {
    db;
    logger = new common_1.Logger(CalendarService_1.name);
    constructor(db) {
        this.db = db;
    }
    async detectConflicts(userId, startTime, endTime, excludeEventId) {
        const params = [userId, startTime.toISOString(), endTime.toISOString()];
        let excludeClause = '';
        if (excludeEventId) {
            params.push(excludeEventId);
            excludeClause = ` AND id != $${params.length}`;
        }
        const res = await this.db.query(`SELECT id, title, start_time, end_time
       FROM calendar_events
       WHERE user_id = $1
         AND start_time < $3::timestamptz
         AND end_time > $2::timestamptz
         ${excludeClause}
       ORDER BY start_time ASC;`, params, userId);
        return res.rows.map((r) => {
            const eStart = Math.max(startTime.getTime(), new Date(r.start_time).getTime());
            const eEnd = Math.min(endTime.getTime(), new Date(r.end_time).getTime());
            const overlapMinutes = Math.max(0, Math.round((eEnd - eStart) / (1000 * 60)));
            return {
                conflictingEventId: r.id,
                title: r.title,
                startTime: r.start_time.toISOString(),
                endTime: r.end_time.toISOString(),
                overlapMinutes,
            };
        });
    }
    async listEvents(userId, query) {
        const conditions = ['user_id = $1'];
        const params = [userId];
        if (query.accountId) {
            params.push(query.accountId);
            conditions.push(`account_id = $${params.length}`);
        }
        if (query.start) {
            params.push(query.start);
            conditions.push(`end_time >= $${params.length}`);
        }
        if (query.end) {
            params.push(query.end);
            conditions.push(`start_time <= $${params.length}`);
        }
        const sql = `
      SELECT id, account_id, title, description, location, join_url,
             start_time, end_time, is_all_day, attendees, created_at, updated_at
      FROM calendar_events
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_time ASC;
    `;
        const res = await this.db.query(sql, params, userId);
        return res.rows.map((r) => ({
            id: r.id,
            accountId: r.account_id,
            title: r.title,
            description: r.description,
            location: r.location,
            joinUrl: r.join_url,
            startTime: r.start_time.toISOString(),
            endTime: r.end_time.toISOString(),
            isAllDay: r.is_all_day,
            attendees: r.attendees,
            createdAt: r.created_at.toISOString(),
            updatedAt: r.updated_at.toISOString(),
        }));
    }
    async createEvent(userId, dto) {
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);
        const conflicts = await this.detectConflicts(userId, start, end);
        if (conflicts.length > 0) {
            this.logger.warn(`Scheduling conflict detected for user ${userId}: overlaps with ${conflicts.length} event(s)`);
        }
        const id = (0, uuid_1.v7)();
        const res = await this.db.query(`INSERT INTO calendar_events (id, user_id, account_id, title, description, location, join_url, start_time, end_time, is_all_day, attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, start_time, end_time, created_at;`, [
            id,
            userId,
            dto.accountId,
            dto.title,
            dto.description || null,
            dto.location || null,
            dto.joinUrl || null,
            start.toISOString(),
            end.toISOString(),
            dto.isAllDay ?? false,
            JSON.stringify(dto.attendees || []),
        ], userId);
        return {
            id,
            title: dto.title,
            conflicts,
            ...res.rows[0],
        };
    }
    async deleteEvent(userId, eventId) {
        const res = await this.db.query(`DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id;`, [eventId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Calendar event ${eventId} not found`);
        }
        return { success: true, message: 'Calendar event deleted' };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map