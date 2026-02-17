# API Credential Encryption Setup

This document describes how to set up and use encrypted API credentials for provider authentication.

## Architecture

API keys are stored encrypted in a separate `api_credentials` table and referenced by providers via foreign key.

**Encryption Specification:**
- Algorithm: AES-256-GCM
- Key Size: 256 bits (32 bytes, 44 base64 characters)
- IV Size: 12 bytes (96 bits)
- Tag Size: 128 bits (16 bytes)
- Storage Format: Base64-encoded strings

## Database Schema

```sql
CREATE TABLE api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    encrypted_value TEXT NOT NULL,
    initialization_vector TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to providers table
ALTER TABLE providers
    ADD COLUMN api_credential_id UUID REFERENCES api_credentials(id);

-- Create index for faster lookups
CREATE INDEX idx_api_credentials_org ON api_credentials(organization_id);
```

## Setup Instructions

### 1. Generate Encryption Key

Generate a secure 256-bit encryption key:

```bash
npm run encrypt-key -- --generate-key
```

Add the generated key to your `.env` file on each worker:

```bash
ENCRYPTION_KEY=<your-44-character-base64-key>
```

Example:
```bash
ENCRYPTION_KEY=oaJy1FWSpSIR+Fa1q2IcPSyMhk5I18qApHNT7kIvAxU=
```

**IMPORTANT:**
- Store this key securely
- Use the same key across all workers
- Never commit this key to version control
- Rotate keys periodically using a proper migration strategy

### 2. Encrypt Existing API Keys

Encrypt your provider API keys:

```bash
npm run encrypt-key -- "sk-1234567890abcdef" "your-encryption-key"
```

Output:
```json
{
  "encryptedValue": "...",
  "initializationVector": "..."
}
```

### 3. Migrate Data

Insert encrypted credentials into the database:

```sql
-- Insert encrypted credential
INSERT INTO api_credentials (id, organization_id, encrypted_value, initialization_vector)
VALUES (
    gen_random_uuid(),
    '<organization-id>',
    '<encrypted-value>',
    '<initialization-vector>'
) RETURNING id;

-- Update provider to reference the credential
UPDATE providers
SET api_credential_id = '<returned-credential-id>'
WHERE name = '<provider-name>';

-- Remove plaintext API key from config
UPDATE providers
SET config = config - 'apiKey'
WHERE name = '<provider-name>';
```

### 4. Migration Script Example

```sql
-- migration-encrypt-api-keys.sql

BEGIN;

-- For each provider with an API key in config
DO $$
DECLARE
    provider_record RECORD;
    credential_id UUID;
BEGIN
    FOR provider_record IN
        SELECT id, organization_id, name, config->>'apiKey' as api_key
        FROM providers
        WHERE config ? 'apiKey'
    LOOP
        -- Note: This is a template - you must encrypt keys using the encrypt-key script
        -- and insert them manually or use a custom migration script

        -- Example structure (replace with actual encrypted values):
        INSERT INTO api_credentials (organization_id, encrypted_value, initialization_vector)
        VALUES (
            provider_record.organization_id,
            '<ENCRYPTED_VALUE_FOR_' || provider_record.name || '>',
            '<IV_FOR_' || provider_record.name || '>'
        ) RETURNING id INTO credential_id;

        -- Update provider
        UPDATE providers
        SET api_credential_id = credential_id,
            config = config - 'apiKey'
        WHERE id = provider_record.id;

        RAISE NOTICE 'Migrated provider: %', provider_record.name;
    END LOOP;
END $$;

COMMIT;
```

## Key Rotation

When rotating encryption keys:

1. Generate a new encryption key
2. Decrypt all credentials with the old key
3. Re-encrypt with the new key
4. Update all worker `.env` files simultaneously
5. Restart all workers

**Script for key rotation:**

```bash
npm run rotate-encryption-key -- old-key new-key
```

## Security Best Practices

### DO:
✅ Use environment variables for the encryption key
✅ Restrict database access to the `api_credentials` table
✅ Enable audit logging for credential access
✅ Rotate keys periodically (every 90-180 days)
✅ Use TLS for all database connections
✅ Implement least-privilege access control

### DON'T:
❌ Store encryption keys in the database
❌ Commit encryption keys to version control
❌ Log decrypted API keys
❌ Send encryption keys over RabbitMQ or other message queues
❌ Store keys in application code
❌ Use weak or predictable encryption keys

## Secrets Management Options

For production environments, consider using a dedicated secrets manager:

### Option 1: HashiCorp Vault (Recommended)
- Centralized secret storage
- Automatic key rotation
- Audit logging
- Dynamic secrets

### Option 2: AWS Secrets Manager
- Integrated with AWS services
- Automatic rotation support
- Fine-grained IAM permissions

### Option 3: Google Secret Manager
- Native GCP integration
- Versioning and rotation

### Option 4: Kubernetes Secrets
- If running in Kubernetes
- Native to the platform
- Can integrate with external secret managers

## Troubleshooting

### Error: "ENCRYPTION_KEY not found in environment variables"
- Ensure `.env` file contains `ENCRYPTION_KEY=<your-key>`
- Check that dotenv is loaded before the env module

### Error: "ENCRYPTION_KEY must be 32 bytes (44 base64 characters)"
- Verify key is exactly 44 base64 characters (ending with = or ==)
- Use `--generate-key` to create a valid key

### Error: "Failed to decrypt credential"
- Verify encryption key matches the one used to encrypt
- Check that encrypted_value and initialization_vector are not corrupted
- Ensure database stores values correctly (no truncation)

### Error: "Invalid IV length. Expected 12 bytes."
- Check that initialization_vector is base64-encoded and 16 characters
- Verify database column is TEXT or VARCHAR with sufficient length

## Monitoring

Add monitoring for:
- Failed decryption attempts
- Credential access patterns
- Unusual provider initialization failures

Example log patterns to alert on:
```
"Decryption failed"
"Failed to decrypt API key for provider"
"ENCRYPTION_KEY not found"
```
