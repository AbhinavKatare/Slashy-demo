import { Request } from 'express';
import { AdminService } from './admin.service';
import { AuditLogQueryDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getHealth(): {
        status: string;
        service: string;
        timestamp: string;
    };
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        database: {
            totalUsers: number;
            totalAccounts: number;
            totalThreads: number;
            activeSessions: number;
            pendingOutboxOperations: number;
        };
        redis: {
            status: string;
        };
    }>;
    getMetrics(): Promise<{
        status: string;
        timestamp: string;
        database: {
            totalUsers: number;
            totalAccounts: number;
            totalThreads: number;
            activeSessions: number;
            pendingOutboxOperations: number;
        };
        redis: {
            status: string;
        };
    }>;
    getAuditLogs(req: Request, query: AuditLogQueryDto): Promise<{
        id: any;
        action: any;
        resourceType: any;
        resourceId: any;
        ipAddress: any;
        metadata: any;
        createdAt: any;
    }[]>;
    exportUserData(req: Request): Promise<{
        exportMetadata: {
            exportedAt: string;
            formatVersion: string;
            service: string;
        };
        user: any;
        connectedAccounts: any[];
        threads: any[];
        drafts: any[];
        calendarEvents: any[];
        tasks: any[];
    }>;
    deleteUserAccount(req: Request): Promise<{
        success: boolean;
        message: string;
        deletedAt: string;
    }>;
}
