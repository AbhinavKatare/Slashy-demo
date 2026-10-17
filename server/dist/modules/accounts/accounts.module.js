"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsModule = void 0;
const common_1 = require("@nestjs/common");
const accounts_controller_1 = require("./accounts.controller");
const accounts_service_1 = require("./accounts.service");
const oauth_connect_service_1 = require("./oauth-connect.service");
const envelope_encryption_service_1 = require("../../common/crypto/envelope-encryption.service");
const local_kms_service_1 = require("../../common/crypto/kms/local-kms.service");
let AccountsModule = class AccountsModule {
};
exports.AccountsModule = AccountsModule;
exports.AccountsModule = AccountsModule = __decorate([
    (0, common_1.Module)({
        controllers: [accounts_controller_1.AccountsController],
        providers: [accounts_service_1.AccountsService, oauth_connect_service_1.OAuthConnectService, envelope_encryption_service_1.EnvelopeEncryptionService, local_kms_service_1.LocalKmsService],
        exports: [accounts_service_1.AccountsService, oauth_connect_service_1.OAuthConnectService, envelope_encryption_service_1.EnvelopeEncryptionService],
    })
], AccountsModule);
//# sourceMappingURL=accounts.module.js.map