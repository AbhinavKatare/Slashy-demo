"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClamAvScannerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClamAvScannerService = void 0;
const common_1 = require("@nestjs/common");
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
let ClamAvScannerService = ClamAvScannerService_1 = class ClamAvScannerService {
    logger = new common_1.Logger(ClamAvScannerService_1.name);
    async scanBuffer(buffer, filename) {
        const contentString = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
        if (contentString.includes(EICAR_SIGNATURE) || filename.toLowerCase().includes('eicar')) {
            this.logger.warn(`[SECURITY ALERT] Malware signature detected in attachment "${filename}": Win.Test.EICAR_HDB-1`);
            return {
                isInfected: true,
                virusName: 'Win.Test.EICAR_HDB-1',
            };
        }
        if (buffer.length >= 4) {
            const isPe = buffer[0] === 0x4d && buffer[1] === 0x5a;
            const isElf = buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46;
            if (isPe || isElf) {
                this.logger.warn(`[SECURITY ALERT] Executable binary header found in file "${filename}"`);
                return {
                    isInfected: true,
                    virusName: 'Heuristic.ExecutableInDisguise',
                };
            }
        }
        return {
            isInfected: false,
        };
    }
};
exports.ClamAvScannerService = ClamAvScannerService;
exports.ClamAvScannerService = ClamAvScannerService = ClamAvScannerService_1 = __decorate([
    (0, common_1.Injectable)()
], ClamAvScannerService);
//# sourceMappingURL=clamav-scanner.service.js.map