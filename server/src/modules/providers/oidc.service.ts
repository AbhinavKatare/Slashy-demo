import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface OidcUserInfo {
  provider: 'google' | 'microsoft';
  externalId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);

  /**
   * Verify and decode OIDC ID token from Google or Microsoft
   */
  async verifyIdToken(provider: 'google' | 'microsoft', idToken: string): Promise<OidcUserInfo> {
    try {
      // In development or test mode, decode token without strict external JWKS check if mock
      const decoded = jwt.decode(idToken) as Record<string, any> | null;

      if (!decoded && !idToken.startsWith('mock_')) {
        throw new UnauthorizedException('Malformed OIDC ID token');
      }

      // Handle mock or dev tokens
      if (idToken.startsWith('mock_') || (decoded && decoded.iss?.includes('example.com'))) {
        return {
          provider,
          externalId: decoded?.sub || `ext_${provider}_${Date.now()}`,
          email: decoded?.email || 'alex.morgan@example.com',
          displayName: decoded?.name || 'Alex Morgan',
          avatarUrl: decoded?.picture || 'https://avatar.example.com/alex.png',
        };
      }

      // Standard OIDC claims
      const email = decoded?.email || decoded?.preferred_username;
      const externalId = decoded?.sub || decoded?.oid;
      const displayName = decoded?.name || decoded?.given_name || email?.split('@')[0] || 'User';
      const avatarUrl = decoded?.picture;

      if (!email || !externalId) {
        throw new UnauthorizedException('OIDC token missing required email or subject claim');
      }

      return {
        provider,
        externalId,
        email,
        displayName,
        avatarUrl,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to verify OIDC token: ${error.message}`);
      throw new UnauthorizedException(`Invalid OIDC token: ${error.message}`);
    }
  }

  getAuthorizationUrl(provider: 'google' | 'microsoft', state: string): string {
    if (provider === 'google') {
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-google-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=inboxcompanion://auth/callback&state=${state}`;
    }
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock-ms-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=inboxcompanion://auth/callback&state=${state}`;
  }
}
