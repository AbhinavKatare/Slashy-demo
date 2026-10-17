export declare enum ConnectProvider {
    GOOGLE = "google",
    MICROSOFT = "microsoft"
}
export declare enum ScopeTier {
    READONLY = "readonly",
    MODIFY_SEND = "modify_send"
}
export declare class GetConnectUrlQueryDto {
    provider: ConnectProvider;
    tier?: ScopeTier;
    redirectUri: string;
}
export declare class ConnectCallbackDto {
    provider: ConnectProvider;
    code: string;
    codeVerifier: string;
    state: string;
    redirectUri: string;
}
export declare class DisconnectAccountDto {
    purgeData?: boolean;
}
