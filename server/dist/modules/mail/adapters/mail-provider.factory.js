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
exports.MailProviderFactory = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
const envelope_encryption_service_1 = require("../../../common/crypto/envelope-encryption.service");
const gmail_adapter_1 = require("./gmail.adapter");
const graph_adapter_1 = require("./graph.adapter");
let MailProviderFactory = class MailProviderFactory {
    db;
    envelopeCrypto;
    constructor(db, envelopeCrypto) {
        this.db = db;
        this.envelopeCrypto = envelopeCrypto;
    }
    async getProviderForAccount(userId, accountId) {
        const res = await this.db.query(`SELECT a.provider, c.encrypted_access_token, c.encrypted_refresh_token,
              c.encrypted_data_key, c.iv, c.tag
       FROM connected_accounts a
       JOIN oauth_credentials c ON a.id = c.connected_account_id
       WHERE a.id = $1 AND a.user_id = $2;`, [accountId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Connected account ${accountId} not found or no credentials stored`);
        }
        const row = res.rows[0];
        const accessToken = await this.envelopeCrypto.decrypt({
            ciphertext: row.encrypted_access_token,
            encryptedDataKey: row.encrypted_data_key,
            iv: row.iv,
            tag: row.tag,
        });
        if (row.provider === 'google') {
            return new gmail_adapter_1.GmailAdapter({ accessToken });
        }
        else if (row.provider === 'microsoft') {
            return new graph_adapter_1.GraphAdapter({ accessToken });
        }
        else {
            throw new Error(`Unsupported provider: ${row.provider}`);
        }
    }
};
exports.MailProviderFactory = MailProviderFactory;
exports.MailProviderFactory = MailProviderFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        envelope_encryption_service_1.EnvelopeEncryptionService])
], MailProviderFactory);
//# sourceMappingURL=mail-provider.factory.js.map