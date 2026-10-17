import { Request } from 'express';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto, ListEventsQueryDto } from './dto/calendar.dto';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    listEvents(req: Request, query: ListEventsQueryDto): Promise<{
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
    createEvent(req: Request, dto: CreateCalendarEventDto): Promise<any>;
    deleteEvent(req: Request, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
