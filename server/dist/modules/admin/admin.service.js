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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const redis_service_1 = require("../../common/redis/redis.service");
const audit_log_service_1 = require("../../common/audit/audit-log.service");
let AdminService = AdminService_1 = class AdminService {
    db;
    redis;
    auditLog;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(db, redis, auditLog) {
        this.db = db;
        this.redis = redis;
        this.auditLog = auditLog;
    }
    async getMetrics() {
        const counts = await this.db.query(`SELECT 
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM connected_accounts) AS total_accounts,
        (SELECT COUNT(*) FROM threads WHERE deleted_at IS NULL) AS total_threads,
        (SELECT COUNT(*) FROM sessions WHERE expires_at > clock_timestamp()) AS active_sessions,
        (SELECT COUNT(*) FROM outbox_operations WHERE status = 'pending') AS pending_outbox_ops;`, []);
        const isRedisReady = this.redis.isReady();
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                totalUsers: Number(counts.rows[0]?.total_users || 0),
                totalAccounts: Number(counts.rows[0]?.total_accounts || 0),
                totalThreads: Number(counts.rows[0]?.total_threads || 0),
                activeSessions: Number(counts.rows[0]?.active_sessions || 0),
                pendingOutboxOperations: Number(counts.rows[0]?.pending_outbox_ops || 0),
            },
            redis: {
                status: isRedisReady ? 'connected' : 'in-memory-fallback',
            },
        };
    }
    async getAuditLogs(userId, limit = 50) {
        const res = await this.db.query(`SELECT id, user_id, action, resource_type, resource_id, ip_address, metadata, created_at
       FROM audit_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2;`, [userId, limit], userId);
        return res.rows.map((r) => ({
            id: r.id,
            action: r.action,
            resourceType: r.resource_type,
            resourceId: r.resource_id,
            ipAddress: r.ip_address,
            metadata: r.metadata,
            createdAt: r.created_at.toISOString(),
        }));
    }
    async exportUserData(userId) {
        const userRes = await this.db.query(`SELECT id, email, display_name, created_at FROM users WHERE id = $1;`, [userId], userId);
        if (!userRes.rows[0]) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        const accountsRes = await this.db.query(`SELECT id, provider, external_id, scopes, status, created_at FROM connected_accounts WHERE user_id = $1;`, [userId], userId);
        const threadsRes = await this.db.query(`SELECT id, account_id, subject, snippet, folder, is_unread, is_starred, last_message_at FROM threads WHERE user_id = $1;`, [userId], userId);
        const draftsRes = await this.db.query(`SELECT id, account_id, subject, body_plain, to_recipients, created_at FROM drafts WHERE user_id = $1;`, [userId], userId);
        const calendarRes = await this.db.query(`SELECT id, title, start_time, end_time, location FROM calendar_events WHERE user_id = $1;`, [userId], userId);
        const tasksRes = await this.db.query(`SELECT id, title, due_date, is_completed FROM tasks WHERE user_id = $1;`, [userId], userId);
        await this.auditLog.log({
            userId,
            action: 'gdpr_data_export',
            resourceType: 'user_data',
            resourceId: userId,
        });
        return {
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                formatVersion: '1.0',
                service: 'Inbox Companion',
            },
            user: userRes.rows[0],
            connectedAccounts: accountsRes.rows,
            threads: threadsRes.rows,
            drafts: draftsRes.rows,
            calendarEvents: calendarRes.rows,
            tasks: tasksRes.rows,
        };
    }
    async deleteUserAccount(userId) {
        this.logger.warn(`[GDPR PURGE] Initiating permanent cascading deletion for user ${userId}`);
        await this.db.query(`DELETE FROM thread_embeddings WHERE user_id = $1;`, [userId], userId);
        const deleteRes = await this.db.query(`DELETE FROM users WHERE id = $1 RETURNING id, email;`, [userId], userId);
        if (!deleteRes.rows[0]) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        this.logger.log(`[GDPR PURGE] Successfully purged user ${userId} and all related data.`);
        return {
            success: true,
            message: 'Account and all associated personal data permanently purged.',
            deletedAt: new Date().toISOString(),
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        redis_service_1.RedisService,
        audit_log_service_1.AuditLogService])
], AdminService);
//# sourceMappingURL=admin.service.js.map