export interface SearchOptions {
    accountId?: string;
    limit?: number;
    cursor?: string;
    useSemantic?: boolean;
}
export interface SearchResultItem {
    id: string;
    accountId: string;
    subject: string;
    snippet: string;
    folder: string;
    isUnread: boolean;
    isStarred: boolean;
    lastMessageAt: string;
    highlightedSubject?: string;
    highlightedSnippet?: string;
    score?: number;
}
export interface SearchResult {
    results: SearchResultItem[];
    total: number;
    nextCursor?: string;
}
export interface SearchEngine {
    search(userId: string, query: string, options?: SearchOptions): Promise<SearchResult>;
    indexThread?(userId: string, thread: any): Promise<void>;
    deleteUserIndices?(userId: string): Promise<void>;
}
