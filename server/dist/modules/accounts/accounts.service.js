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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let AccountsService = class AccountsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listAccounts(userId) {
        const res = await this.db.query(`SELECT id, provider, external_id, email, display_name, scopes, status, created_at, updated_at
       FROM connected_accounts
       WHERE user_id = $1
       ORDER BY created_at ASC;`, [userId], userId);
        return res.rows;
    }
    async getAccount(userId, accountId) {
        const res = await this.db.query(`SELECT id, provider, external_id, email, display_name, scopes, status, created_at, updated_at
       FROM connected_accounts
       WHERE id = $1 AND user_id = $2;`, [accountId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Account ${accountId} not found`);
        }
        return res.rows[0];
    }
    async disconnectAccount(userId, accountId) {
        await this.db.transaction(async (client) => {
            await client.query(`DELETE FROM connected_accounts WHERE id = $1 AND user_id = $2;`, [
                accountId,
                userId,
            ]);
        }, userId);
        return { success: true, message: 'Account disconnected and data wiped' };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map