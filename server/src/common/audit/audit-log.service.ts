import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v7 as uuidv7 } from 'uuid';

export interface AuditEvent {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly db: DatabaseService) {}

  async log(event: AuditEvent): Promise<void> {
    try {
      const id = uuidv7();
      await this.db.query(
        `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          id,
          event.userId,
          event.action,
          event.resourceType,
          event.resourceId || null,
          event.ipAddress || null,
          JSON.stringify(event.metadata || {}),
        ],
        event.userId,
      );

      this.logger.log(
        `[AUDIT] Action "${event.action}" logged for user ${event.userId} on ${event.resourceType}:${event.resourceId || '*'}`,
      );
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${(err as Error).message}`);
    }
  }
}
