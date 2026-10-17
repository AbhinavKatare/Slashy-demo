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
var EnvelopeEncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvelopeEncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const local_kms_service_1 = require("./kms/local-kms.service");
let EnvelopeEncryptionService = EnvelopeEncryptionService_1 = class EnvelopeEncryptionService {
    kms;
    logger = new common_1.Logger(EnvelopeEncryptionService_1.name);
    constructor(kms) {
        this.kms = kms;
    }
    async encrypt(plaintextSecret) {
        const { plaintextKey, ciphertextKey } = await this.kms.generateDataKey();
        try {
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', plaintextKey, iv);
            let encrypted = cipher.update(plaintextSecret, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag().toString('hex');
            return {
                ciphertext: encrypted,
                iv: iv.toString('hex'),
                tag,
                encryptedDataKey: ciphertextKey,
            };
        }
        finally {
            plaintextKey.fill(0);
        }
    }
    async decrypt(payload) {
        const plaintextKey = await this.kms.decryptDataKey(payload.encryptedDataKey);
        try {
            const iv = Buffer.from(payload.iv, 'hex');
            const tag = Buffer.from(payload.tag, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', plaintextKey, iv);
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        finally {
            plaintextKey.fill(0);
        }
    }
};
exports.EnvelopeEncryptionService = EnvelopeEncryptionService;
exports.EnvelopeEncryptionService = EnvelopeEncryptionService = EnvelopeEncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [local_kms_service_1.LocalKmsService])
], EnvelopeEncryptionService);
//# sourceMappingURL=envelope-encryption.service.js.map