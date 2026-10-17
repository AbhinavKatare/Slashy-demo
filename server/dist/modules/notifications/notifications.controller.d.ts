import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { RegisterNotificationTokenDto, UnregisterNotificationTokenDto } from './dto/notifications.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerToken(req: Request, dto: RegisterNotificationTokenDto): Promise<{
        success: boolean;
        token: any;
    }>;
    unregisterToken(req: Request, dto: UnregisterNotificationTokenDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
