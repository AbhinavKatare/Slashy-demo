"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsModule = void 0;
const common_1 = require("@nestjs/common");
const drafts_controller_1 = require("./drafts.controller");
const drafts_service_1 = require("./drafts.service");
const sending_service_1 = require("./sending.service");
const clamav_scanner_service_1 = require("../../common/security/clamav-scanner.service");
const mail_module_1 = require("../mail/mail.module");
let DraftsModule = class DraftsModule {
};
exports.DraftsModule = DraftsModule;
exports.DraftsModule = DraftsModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule],
        controllers: [drafts_controller_1.DraftsController],
        providers: [drafts_service_1.DraftsService, sending_service_1.SendingService, clamav_scanner_service_1.ClamAvScannerService],
        exports: [drafts_service_1.DraftsService, sending_service_1.SendingService, clamav_scanner_service_1.ClamAvScannerService],
    })
], DraftsModule);
//# sourceMappingURL=drafts.module.js.map