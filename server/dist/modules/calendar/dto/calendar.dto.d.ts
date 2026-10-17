export declare class CreateCalendarEventDto {
    accountId: string;
    title: string;
    description?: string;
    location?: string;
    joinUrl?: string;
    startTime: string;
    endTime: string;
    isAllDay?: boolean;
    attendees?: string[];
}
export declare class ListEventsQueryDto {
    start?: string;
    end?: string;
    accountId?: string;
}
