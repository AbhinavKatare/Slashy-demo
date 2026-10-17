import { DatabaseService } from '../../database/database.service';
import { CreateCalendarEventDto, ListEventsQueryDto } from './dto/calendar.dto';
export interface EventConflictHint {
    conflictingEventId: string;
    title: string;
    startTime: string;
    endTime: string;
    overlapMinutes: number;
}
export declare class CalendarService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    detectConflicts(userId: string, startTime: Date, endTime: Date, excludeEventId?: string): Promise<EventConflictHint[]>;
    listEvents(userId: string, query: ListEventsQueryDto): Promise<{
        id: any;
        accountId: any;
        title: any;
        description: any;
        location: any;
        joinUrl: any;
        startTime: any;
        endTime: any;
        isAllDay: any;
        attendees: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    createEvent(userId: string, dto: CreateCalendarEventDto): Promise<any>;
    deleteEvent(userId: string, eventId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
