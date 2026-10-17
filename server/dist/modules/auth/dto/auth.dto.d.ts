export declare enum AuthProvider {
    GOOGLE = "google",
    MICROSOFT = "microsoft"
}
export declare class OidcLoginDto {
    provider: AuthProvider;
    idToken: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    pushToken?: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthTokensResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl?: string;
    };
}
export declare class SessionResponseDto {
    id: string;
    deviceName?: string;
    platform?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    lastActiveAt: string;
    isCurrent: boolean;
}
