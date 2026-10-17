export declare class RegisterNotificationTokenDto {
    token: string;
    platform: 'android' | 'ios' | 'web';
    deviceId?: string;
}
export declare class UnregisterNotificationTokenDto {
    token: string;
}
