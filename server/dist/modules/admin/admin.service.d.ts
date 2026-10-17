import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
export declare class AdminService {
    private readonly db;
    private readonly redis;
    private readonly auditLog;
    private readonly logger;
    constructor(db: DatabaseService, redis: RedisService, auditLog: AuditLogService);
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
    getAuditLogs(userId: string, limit?: number): Promise<{
        id: any;
        action: any;
        resourceType: any;
        resourceId: any;
        ipAddress: any;
        metadata: any;
        createdAt: any;
    }[]>;
    exportUserData(userId: string): Promise<{
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
    deleteUserAccount(userId: string): Promise<{
        success: boolean;
        message: string;
        deletedAt: string;
    }>;
}
