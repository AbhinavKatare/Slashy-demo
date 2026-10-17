export interface ParsedSearchQuery {
    from?: string;
    to?: string;
    hasAttachment?: boolean;
    isUnread?: boolean;
    isStarred?: boolean;
    before?: Date;
    after?: Date;
    label?: string;
    folder?: string;
    freeText: string;
}
export declare class QueryParser {
    static parse(query: string): ParsedSearchQuery;
}
