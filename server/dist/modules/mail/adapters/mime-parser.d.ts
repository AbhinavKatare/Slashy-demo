export interface ParsedMimeContent {
    bodyPlain: string;
    bodyHtml: string;
    attachments: Array<{
        id: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        dataBase64?: string;
    }>;
}
export declare function decodeBase64Url(data: string): string;
export declare function parseGmailParts(payload: any): ParsedMimeContent;
export declare function parseAddressList(headerValue?: string): Array<{
    name: string;
    email: string;
}>;
