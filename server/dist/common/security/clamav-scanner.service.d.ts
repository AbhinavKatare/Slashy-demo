import { MalwareScanner, ScanResult } from './malware-scanner.interface';
export declare class ClamAvScannerService implements MalwareScanner {
    private readonly logger;
    scanBuffer(buffer: Buffer, filename: string): Promise<ScanResult>;
}
