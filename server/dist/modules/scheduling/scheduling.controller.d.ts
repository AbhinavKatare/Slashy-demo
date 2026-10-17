import { Request } from 'express';
import { SchedulingService } from './scheduling.service';
import { ScheduleDraftDto } from './dto/scheduling.dto';
export declare class SchedulingController {
    private readonly schedulingService;
    constructor(schedulingService: SchedulingService);
    scheduleDraft(req: Request, dto: ScheduleDraftDto): Promise<any>;
    listScheduled(req: Request): Promise<{
        id: any;
        accountId: any;
        draftId: any;
        subject: any;
        toRecipients: any;
        scheduledAt: any;
        timezone: any;
        status: any;
    }[]>;
    cancelScheduled(req: Request, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
