import { DatabaseService } from '../../database/database.service';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { OidcService } from '../providers/oidc.service';
import { AuthTokensResponseDto, OidcLoginDto, SessionResponseDto } from './dto/auth.dto';
export interface JwtAccessPayload {
    sub: string;
    email: string;
    sessionId: string;
}
export interface JwtRefreshPayload {
    sub: string;
    sessionId: string;
    family: string;
    jti?: string;
}
export declare class AuthService {
    private readonly db;
    private readonly encryptionService;
    private readonly oidcService;
    private readonly logger;
    constructor(db: DatabaseService, encryptionService: EncryptionService, oidcService: OidcService);
    loginWithOidc(dto: OidcLoginDto, ipAddress?: string, userAgent?: string): Promise<AuthTokensResponseDto>;
    rotateRefreshToken(oldRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    listSessions(userId: string, currentSessionId?: string): Promise<SessionResponseDto[]>;
    revokeSession(userId: string, sessionId: string): Promise<void>;
    revokeAllSessions(userId: string): Promise<void>;
    private createAccessToken;
    private createRefreshToken;
}
