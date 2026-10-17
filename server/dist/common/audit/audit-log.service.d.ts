import { DatabaseService } from '../../database/database.service';
export interface AuditEvent {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
}
export declare class AuditLogService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    log(event: AuditEvent): Promise<void>;
}
