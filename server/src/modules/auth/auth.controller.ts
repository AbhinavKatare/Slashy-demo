import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  AuthTokensResponseDto,
  OidcLoginDto,
  RefreshTokenDto,
  SessionResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard, Public } from './guards/jwt-auth.guard';
import { RateLimit, RateLimiterGuard } from '../../common/guards/rate-limiter.guard';
import { OidcService } from '../providers/oidc.service';
import { env } from '../../config/env.config';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RateLimiterGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oidcService: OidcService,
  ) {}

  @Public()
  @Get('google/url')
  @ApiOperation({ summary: 'Get Google OIDC authorization URL for Custom Tabs' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  getGoogleAuthUrl(@Query('state') state?: string) {
    return {
      url: this.oidcService.getAuthorizationUrl('google', state || 'state_nonce'),
    };
  }

  @Public()
  @Get('microsoft/url')
  @ApiOperation({ summary: 'Get Microsoft OIDC authorization URL for Custom Tabs' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  getMicrosoftAuthUrl(@Query('state') state?: string) {
    return {
      url: this.oidcService.getAuthorizationUrl('microsoft', state || 'state_nonce'),
    };
  }

  @Public()
  @Post('oidc/login')
  @HttpCode(HttpStatus.OK)
  @RateLimit(10, 60) // 10 logins per minute
  @ApiOperation({ summary: 'Login via OIDC identity token (Google / Microsoft)' })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  async login(
    @Body() dto: OidcLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponseDto> {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await this.authService.loginWithOidc(dto, ip, userAgent);

    // Set secure HTTP-only cookies for web clients
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
      domain: env.COOKIE_DOMAIN,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: env.COOKIE_DOMAIN,
      path: '/v1/auth',
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit(30, 60) // 30 refresh calls per minute
  @ApiOperation({ summary: 'Rotate refresh token and issue new token pair' })
  @ApiResponse({ status: 200, description: 'Rotated token pair' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || req.cookies?.['refresh_token'];
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await this.authService.rotateRefreshToken(token, ip, userAgent);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      domain: env.COOKIE_DOMAIN,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: env.COOKIE_DOMAIN,
      path: '/v1/auth',
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current device session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (req.user) {
      await this.authService.revokeSession(req.user.userId, req.user.sessionId);
    }
    res.clearCookie('access_token', { domain: env.COOKIE_DOMAIN });
    res.clearCookie('refresh_token', { domain: env.COOKIE_DOMAIN, path: '/v1/auth' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for current user' })
  @ApiResponse({ status: 200, type: [SessionResponseDto] })
  async listSessions(@Req() req: Request): Promise<SessionResponseDto[]> {
    return this.authService.listSessions(req.user!.userId, req.user!.sessionId);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific device session' })
  async revokeSession(@Param('id') sessionId: string, @Req() req: Request) {
    await this.authService.revokeSession(req.user!.userId, sessionId);
    return { success: true, message: 'Session revoked successfully' };
  }

  @Post('revoke-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for current user across all devices' })
  async revokeAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeAllSessions(req.user!.userId);
    res.clearCookie('access_token', { domain: env.COOKIE_DOMAIN });
    res.clearCookie('refresh_token', { domain: env.COOKIE_DOMAIN, path: '/v1/auth' });
    return { success: true, message: 'All sessions revoked successfully' };
  }
}
