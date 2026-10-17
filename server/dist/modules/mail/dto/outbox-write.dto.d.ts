export declare enum WriteActionType {
    MARK_READ = "mark_read",
    MARK_UNREAD = "mark_unread",
    STAR = "star",
    UNSTAR = "unstar",
    ARCHIVE = "archive",
    TRASH = "trash",
    APPLY_LABEL = "apply_label",
    REMOVE_LABEL = "remove_label"
}
export declare class ModifyThreadActionDto {
    action: WriteActionType;
    labelName?: string;
    eTag?: string;
}
export declare class BulkModifyThreadsDto {
    threadIds: string[];
    action: WriteActionType;
    labelName?: string;
}
