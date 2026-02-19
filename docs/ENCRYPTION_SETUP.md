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

## Setup Instructions

### 1. Generate Encryption Key 

Generate a secure 256-bit encryption key:

```bash
npm run encrypt-key -- --generate-key
```

Add the generated key to your `.env` file on each worker:

```bash
CREDENTIAL_ENCRYPTION_KEY=<your-44-character-base64-key>
```

Example:
```bash
CREDENTIAL_ENCRYPTION_KEY=oaJy1FWSpSIR+Fa1q2IcPSyMhk5I18qApHNT7kIvAxU=
```

**IMPORTANT:**
- Store this key securely
- Use the same key across all workers
- MUST BE SAME VALUE AS CREDENTIAL_ENCRYPTION_KEY IN MOKU!!!!!

### 2. Create API keys in moku for all your providers
- got to moku and under credentials create api keys
- associate those keys to the correct providers 

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

```
