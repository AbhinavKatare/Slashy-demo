import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthTokensResponseDto, OidcLoginDto, RefreshTokenDto, SessionResponseDto } from './dto/auth.dto';
import { OidcService } from '../providers/oidc.service';
export declare class AuthController {
    private readonly authService;
    private readonly oidcService;
    constructor(authService: AuthService, oidcService: OidcService);
    getGoogleAuthUrl(state?: string): {
        url: string;
    };
    getMicrosoftAuthUrl(state?: string): {
        url: string;
    };
    login(dto: OidcLoginDto, req: Request, res: Response): Promise<AuthTokensResponseDto>;
    refresh(dto: RefreshTokenDto, req: Request, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    listSessions(req: Request): Promise<SessionResponseDto[]>;
    revokeSession(sessionId: string, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    revokeAll(req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
}
