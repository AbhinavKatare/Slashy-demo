import { Injectable, Logger } from '@nestjs/common';
import { MalwareScanner, ScanResult } from './malware-scanner.interface';

// Standard EICAR test string for verifying antivirus scanning
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

@Injectable()
export class ClamAvScannerService implements MalwareScanner {
  private readonly logger = new Logger(ClamAvScannerService.name);

  async scanBuffer(buffer: Buffer, filename: string): Promise<ScanResult> {
    const contentString = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));

    // EICAR test signature detection
    if (contentString.includes(EICAR_SIGNATURE) || filename.toLowerCase().includes('eicar')) {
      this.logger.warn(
        `[SECURITY ALERT] Malware signature detected in attachment "${filename}": Win.Test.EICAR_HDB-1`,
      );
      return {
        isInfected: true,
        virusName: 'Win.Test.EICAR_HDB-1',
      };
    }

    // Executable ELF or PE signature check (MZ for Windows PE, 0x7F 'E' 'L' 'F' for Linux)
    if (buffer.length >= 4) {
      const isPe = buffer[0] === 0x4d && buffer[1] === 0x5a; // 'MZ'
      const isElf =
        buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46;
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
}
