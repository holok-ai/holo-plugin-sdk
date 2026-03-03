import {injectable} from 'tsyringe';
import {createDecipheriv} from 'crypto';
import {ClassLogger} from '@holokai/sdk';
import {env} from '../env';

@injectable()
export class CryptoService extends ClassLogger {
    private readonly algorithm = 'aes-256-gcm';
    private readonly tagLength = 16;
    private readonly encryptionKey: Buffer;

    constructor() {
        super();
        const key = env.security.encryptionKey;
        if (!key) {
            throw new Error('ENCRYPTION_KEY not found in environment variables');
        }

        this.encryptionKey = Buffer.from(key, 'base64');

        if (this.encryptionKey.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be 32 bytes (44 base64 characters)');
        }
    }

    decrypt(encryptedValue: string, initializationVector: string): string {
        const logger = this.mlog(this.decrypt);

        try {
            const iv = Buffer.from(initializationVector, 'base64');
            const encryptedData = Buffer.from(encryptedValue, 'base64');

            if (iv.length !== 12) {
                throw new Error('Invalid IV length. Expected 12 bytes.');
            }

            const authTag = encryptedData.subarray(-this.tagLength);
            const ciphertext = encryptedData.subarray(0, -this.tagLength);

            const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString('utf8');
        } catch (error) {
            logger.error(`Decryption failed: ${(error as Error).message}`);
            throw new Error('Failed to decrypt credential');
        }
    }
}
