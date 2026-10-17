import { Request } from 'express';
import { AccountsService } from './accounts.service';
import { OAuthConnectService } from './oauth-connect.service';
import { ConnectCallbackDto, DisconnectAccountDto, GetConnectUrlQueryDto } from './dto/connect.dto';
export declare class AccountsController {
    private readonly accountsService;
    private readonly connectService;
    constructor(accountsService: AccountsService, connectService: OAuthConnectService);
    listAccounts(req: Request): Promise<any[]>;
    getConnectUrl(req: Request, query: GetConnectUrlQueryDto): {
        url: string;
        codeVerifier: string;
        state: string;
        tier: import("./dto/connect.dto").ScopeTier;
        scopes: string[];
    };
    connectCallback(req: Request, dto: ConnectCallbackDto): Promise<{
        success: boolean;
        account: {
            id: any;
            provider: any;
            email: any;
            displayName: any;
            status: any;
            scopes: string[];
            tier: import("./dto/connect.dto").ScopeTier;
        };
    }>;
    getAccount(id: string, req: Request): Promise<any>;
    disconnect(id: string, req: Request, dto?: DisconnectAccountDto): Promise<{
        success: boolean;
        message: string;
    }>;
    disconnectAccount(id: string, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
}
