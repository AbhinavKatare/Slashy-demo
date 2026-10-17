import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AccountsService {
  constructor(private readonly db: DatabaseService) {}

  async listAccounts(userId: string) {
    const res = await this.db.query(
      `SELECT id, provider, external_id, email, display_name, scopes, status, created_at, updated_at
       FROM connected_accounts
       WHERE user_id = $1
       ORDER BY created_at ASC;`,
      [userId],
      userId,
    );
    return res.rows;
  }

  async getAccount(userId: string, accountId: string) {
    const res = await this.db.query(
      `SELECT id, provider, external_id, email, display_name, scopes, status, created_at, updated_at
       FROM connected_accounts
       WHERE id = $1 AND user_id = $2;`,
      [accountId, userId],
      userId,
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    return res.rows[0];
  }

  async disconnectAccount(userId: string, accountId: string) {
    await this.db.transaction(async (client) => {
      await client.query(`DELETE FROM connected_accounts WHERE id = $1 AND user_id = $2;`, [
        accountId,
        userId,
      ]);
    }, userId);
    return { success: true, message: 'Account disconnected and data wiped' };
  }
}
