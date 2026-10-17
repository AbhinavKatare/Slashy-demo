import { DatabaseService } from '../../database/database.service';
export declare class AccountsService {
    private readonly db;
    constructor(db: DatabaseService);
    listAccounts(userId: string): Promise<any[]>;
    getAccount(userId: string, accountId: string): Promise<any>;
    disconnectAccount(userId: string, accountId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
