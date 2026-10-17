import { DatabaseService } from '../../database/database.service';
import { ScheduleDraftDto } from './dto/scheduling.dto';
export declare class SchedulingService {
    private readonly db;
    constructor(db: DatabaseService);
    scheduleDraft(userId: string, dto: ScheduleDraftDto): Promise<any>;
    listScheduled(userId: string): Promise<{
        id: any;
        accountId: any;
        draftId: any;
        subject: any;
        toRecipients: any;
        scheduledAt: any;
        timezone: any;
        status: any;
    }[]>;
    cancelScheduled(userId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
