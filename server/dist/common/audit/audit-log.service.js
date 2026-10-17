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
var AuditLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let AuditLogService = AuditLogService_1 = class AuditLogService {
    db;
    logger = new common_1.Logger(AuditLogService_1.name);
    constructor(db) {
        this.db = db;
    }
    async log(event) {
        try {
            const id = (0, uuid_1.v7)();
            await this.db.query(`INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`, [
                id,
                event.userId,
                event.action,
                event.resourceType,
                event.resourceId || null,
                event.ipAddress || null,
                JSON.stringify(event.metadata || {}),
            ], event.userId);
            this.logger.log(`[AUDIT] Action "${event.action}" logged for user ${event.userId} on ${event.resourceType}:${event.resourceId || '*'}`);
        }
        catch (err) {
            this.logger.error(`Failed to record audit log: ${err.message}`);
        }
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = AuditLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map