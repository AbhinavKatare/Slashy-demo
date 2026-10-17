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
exports.LocalKmsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const env_config_1 = require("../../../config/env.config");
let LocalKmsService = class LocalKmsService {
    masterKey;
    constructor() {
        this.masterKey = Buffer.from(env_config_1.env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
    }
    async generateDataKey() {
        const plaintextKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
        let wrapped = cipher.update(plaintextKey);
        wrapped = Buffer.concat([wrapped, cipher.final()]);
        const tag = cipher.getAuthTag();
        const ciphertextKey = `${iv.toString('hex')}:${tag.toString('hex')}:${wrapped.toString('hex')}`;
        return {
            plaintextKey,
            ciphertextKey,
        };
    }
    async decryptDataKey(ciphertextKey) {
        const parts = ciphertextKey.split(':');
        if (parts.length !== 3) {
            throw new Error('Malformed ciphertext key format. Expected iv:tag:wrappedKey');
        }
        const [ivHex, tagHex, wrappedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const wrapped = Buffer.from(wrappedHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
        decipher.setAuthTag(tag);
        const decrypted = decipher.update(wrapped);
        return Buffer.concat([decrypted, decipher.final()]);
    }
};
exports.LocalKmsService = LocalKmsService;
exports.LocalKmsService = LocalKmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LocalKmsService);
//# sourceMappingURL=local-kms.service.js.map