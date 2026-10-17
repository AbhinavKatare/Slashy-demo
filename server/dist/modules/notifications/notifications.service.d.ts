import { DatabaseService } from '../../database/database.service';
import { RegisterNotificationTokenDto } from './dto/notifications.dto';
export type NotificationChannel = 'urgent_mail' | 'calendar_reminder' | 'tasks';
export interface SendNotificationPayload {
    channel: NotificationChannel;
    title: string;
    body?: string;
    collapseKey?: string;
    threadId?: string;
    eventId?: string;
    isUrgent?: boolean;
}
export declare class NotificationsService {
    private readonly db;
    private readonly logger;
    private readonly dedupeCache;
    constructor(db: DatabaseService);
    registerToken(userId: string, dto: RegisterNotificationTokenDto): Promise<{
        success: boolean;
        token: any;
    }>;
    unregisterToken(userId: string, token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    isWithinQuietHours(quietStart?: string, quietEnd?: string, currentTime?: Date): boolean;
    sendNotification(userId: string, payload: SendNotificationPayload, userPreferences?: {
        quietHoursEnabled?: boolean;
        quietStart?: string;
        quietEnd?: string;
    }): Promise<{
        status: string;
        dedupeKey: string;
        collapseKey?: undefined;
        channel?: undefined;
        title?: undefined;
        body?: undefined;
        dispatchedAt?: undefined;
    } | {
        status: string;
        collapseKey: string;
        dedupeKey?: undefined;
        channel?: undefined;
        title?: undefined;
        body?: undefined;
        dispatchedAt?: undefined;
    } | {
        status: string;
        channel: NotificationChannel;
        collapseKey: string;
        title: string;
        body: string;
        dispatchedAt: string;
        dedupeKey?: undefined;
    }>;
}
