#!/usr/bin/env tsx
import {randomBytes, createCipheriv} from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 12;
const tagLength = 16;

function encryptApiKey(apiKey: string, encryptionKey: string): {
    encryptedValue: string;
    initializationVector: string;
} {
    const key = Buffer.from(encryptionKey, 'base64');

    if (key.length !== keyLength) {
        throw new Error(`Encryption key must be ${keyLength} bytes (44 base64 characters)`);
    }

    const iv = randomBytes(ivLength);
    const cipher = createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);

    return {
        encryptedValue: encryptedWithTag.toString('base64'),
        initializationVector: iv.toString('base64')
    };
}

function generateEncryptionKey(): string {
    return randomBytes(keyLength).toString('base64');
}

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log('Usage:');
        console.log('  Generate new encryption key:');
        console.log('    npm run encrypt-key -- --generate-key');
        console.log('');
        console.log('  Encrypt an API key:');
        console.log('    npm run encrypt-key -- <api-key> <encryption-key>');
        console.log('');
        console.log('Example:');
        console.log('    npm run encrypt-key -- sk-1234567890abcdef oaJy1FWSpSIR+Fa1q2IcPSyMhk5I18qApHNT7kIvAxU=');
        process.exit(0);
    }

    if (args[0] === '--generate-key') {
        const newKey = generateEncryptionKey();
        console.log('Generated encryption key (add to .env as ENCRYPTION_KEY):');
        console.log(newKey);
        process.exit(0);
    }

    if (args.length < 2) {
        console.error('Error: Missing arguments');
        console.error('Run with --help for usage information');
        process.exit(1);
    }

    const [apiKey, encryptionKey] = args;

    try {
        const result = encryptApiKey(apiKey, encryptionKey);
        console.log('Encrypted API Key:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');
        console.log('SQL to insert into database:');
        console.log(`INSERT INTO api_credentials (id, organization_id, encrypted_value, initialization_vector)`);
        console.log(`VALUES (gen_random_uuid(), '<organization-id>', '${result.encryptedValue}', '${result.initializationVector}');`);
    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    }
}

export {encryptApiKey, generateEncryptionKey};
