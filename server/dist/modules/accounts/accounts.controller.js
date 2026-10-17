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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const accounts_service_1 = require("./accounts.service");
const oauth_connect_service_1 = require("./oauth-connect.service");
const connect_dto_1 = require("./dto/connect.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AccountsController = class AccountsController {
    accountsService;
    connectService;
    constructor(accountsService, connectService) {
        this.accountsService = accountsService;
        this.connectService = connectService;
    }
    async listAccounts(req) {
        return this.accountsService.listAccounts(req.user.userId);
    }
    getConnectUrl(req, query) {
        return this.connectService.generateAuthorizeUrl(req.user.userId, query.provider, query.tier, query.redirectUri);
    }
    async connectCallback(req, dto) {
        return this.connectService.handleCallback(req.user.userId, dto);
    }
    async getAccount(id, req) {
        return this.accountsService.getAccount(req.user.userId, id);
    }
    async disconnect(id, req, dto) {
        return this.connectService.disconnectAccount(req.user.userId, id, dto?.purgeData ?? true);
    }
    async disconnectAccount(id, req) {
        return this.connectService.disconnectAccount(req.user.userId, id, true);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all connected accounts for authenticated user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Get)('connect/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate OAuth authorization URL with PKCE and requested scope tier' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, connect_dto_1.GetConnectUrlQueryDto]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getConnectUrl", null);
__decorate([
    (0, common_1.Post)('connect/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Exchange OAuth authorization code + PKCE verifier and store envelope-encrypted tokens',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, connect_dto_1.ConnectCallbackDto]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "connectCallback", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a connected account' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Post)(':id/disconnect'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect account, revoke provider token, and optionally purge data' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, connect_dto_1.DisconnectAccountDto]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect and purge account data' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "disconnectAccount", null);
exports.AccountsController = AccountsController = __decorate([
    (0, swagger_1.ApiTags)('Accounts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService,
        oauth_connect_service_1.OAuthConnectService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map