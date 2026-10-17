import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { EnvelopeEncryptionService } from '../../../common/crypto/envelope-encryption.service';
import { MailProvider } from '../domain/mail-provider.interface';
import { GmailAdapter } from './gmail.adapter';
import { GraphAdapter } from './graph.adapter';

@Injectable()
export class MailProviderFactory {
  constructor(
    private readonly db: DatabaseService,
    private readonly envelopeCrypto: EnvelopeEncryptionService,
  ) {}

  /**
   * Instantiates a MailProvider (Gmail or Graph) for a connected account
   * securely unwrapping tokens with Envelope Encryption in memory.
   */
  async getProviderForAccount(userId: string, accountId: string): Promise<MailProvider> {
    const res = await this.db.query(
      `SELECT a.provider, c.encrypted_access_token, c.encrypted_refresh_token,
              c.encrypted_data_key, c.iv, c.tag
       FROM connected_accounts a
       JOIN oauth_credentials c ON a.id = c.connected_account_id
       WHERE a.id = $1 AND a.user_id = $2;`,
      [accountId, userId],
      userId,
    );

    if (!res.rows[0]) {
      throw new NotFoundException(
        `Connected account ${accountId} not found or no credentials stored`,
      );
    }

    const row = res.rows[0];

    // Decrypt access token in memory using envelope encryption
    const accessToken = await this.envelopeCrypto.decrypt({
      ciphertext: row.encrypted_access_token,
      encryptedDataKey: row.encrypted_data_key,
      iv: row.iv,
      tag: row.tag,
    });

    if (row.provider === 'google') {
      return new GmailAdapter({ accessToken });
    } else if (row.provider === 'microsoft') {
      return new GraphAdapter({ accessToken });
    } else {
      throw new Error(`Unsupported provider: ${row.provider}`);
    }
  }
}
