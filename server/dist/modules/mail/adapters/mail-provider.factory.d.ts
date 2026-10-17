import { DatabaseService } from '../../../database/database.service';
import { EnvelopeEncryptionService } from '../../../common/crypto/envelope-encryption.service';
import { MailProvider } from '../domain/mail-provider.interface';
export declare class MailProviderFactory {
    private readonly db;
    private readonly envelopeCrypto;
    constructor(db: DatabaseService, envelopeCrypto: EnvelopeEncryptionService);
    getProviderForAccount(userId: string, accountId: string): Promise<MailProvider>;
}
