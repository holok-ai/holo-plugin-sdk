# Authentication

Holo uses a single unified auth middleware that resolves one of three mutually exclusive auth methods per request.

## Auth Methods

### JWT (Internal)

Used by Holokai desktop and web apps. The JWT payload contains user and organization identity. Application access is determined by the token claims cached via `TokenService`.

- **Token type:** `jwt`
- **Identity:** `organizationId` + `userId` from JWT payload
- **Application access:** All apps the user is provisioned for

When the JWT `userId` is not a UUID (e.g., an email), the auth service resolves it to the `app_users` UUID via `AccessService.getUserIdByEmail()`. The original value is preserved as `clientIdentifier`.

### HoloToken (External API)

Prefixed with `holo_`. Used for programmatic access — API integrations, service-to-service calls, personal API keys.

Two subtypes based on what the token is bound to:

**Application token** (`holo_application`)
- Bound to a specific `application_id` at creation time
- Can only access that single application's endpoints
- No user identity — service-to-service use case

**User token** (`holo_user`)
- Bound to a `user_id` at creation time
- Access determined by the user's application permissions (via `AccessService`)
- Can access any application the user has been granted access to

### Anonymous

No token provided. Only succeeds when:
1. The request targets an app-specific endpoint (has an `appSlug`)
2. The application's `access_level` is set to `'anonymous'`

- **Token type:** `anonymous`
- **Identity:** Organization derived from the application record, no `userId`

## Token Location

Tokens are extracted in this order:
1. `x-api-key` header
2. `Authorization: Bearer <token>` header

The `holo_` prefix determines which auth path is taken.

## Auth Interface

```typescript
type TokenType = 'holo_user' | 'holo_application' | 'jwt' | 'anonymous';

interface Auth {
    organizationId: string;
    userId?: string;            // UUID FK to app_users
    tokenType: TokenType;
    application?: Application;
    applications: Application[];
    clientIdentifier?: string;  // external identity (email, X-Client-User header)
}
```

## Identity Model

Two identity fields flow through the system:

- **`user_id`** (UUID) — Holokai user identity. FK to `app_users`. Set for JWT users (resolved from email if needed) and HoloToken user tokens.
- **`client_identifier`** (text) — External/forwarded identity. Set from:
  - JWT: the original `userId` value when it's not a UUID (e.g., email)
  - `X-Client-User` header: opaque string for 3rd-party identity forwarding

Both fields are stored as real columns on `provider_requests` and `provider_responses` for direct querying.

## Middleware

All auth is handled by `makeAuthMiddleware()` in `app/src/api/middleware/auth.middleware.ts`. It returns a single Express `RequestHandler`.

```typescript
makeAuthMiddleware(authService, {
    useCache: true,        // enable JWT token caching (default: true)
    allowJwt: true,        // accept JWT tokens (default: true)
    allowHoloToken: true,  // accept HoloTokens (default: true)
    allowAnonymous: false, // allow unauthenticated access (default: false)
    optional: false,       // if true, don't 401 on missing auth (default: false)
    providerFamily: 'openai', // filter applications by provider type
})
```

The middleware:
1. Extracts token from `x-api-key` / `Authorization: Bearer`
2. Extracts `clientIdentifier` from `X-Client-User` header
3. Extracts `appSlug` from route params
4. Routes to the appropriate `AuthService` method based on token prefix
5. Sets `req.auth` on success
6. Returns 403 on auth failure, 401 if no token and not optional

## Caching

### HoloToken Auth Cache

Fully resolved `Auth` objects are cached in Redis to avoid repeated DB/Redis lookups on successive requests.

- **Key:** `auth:{sha256(rawToken)}:{appSlug || '*'}`
- **TTL:** 120 seconds (matches application cache TTL)
- **On hit:** Return cached `Auth` directly, skip all lookups
- **On miss:** Run full pipeline (verify token, load app, check access), then cache

### Cache Invalidation

- **Token deactivation:** `HoloTokenService.deactivate()` clears both the token cache (`holo_token:{hash}`) and all auth entries (`auth:{hash}:*`)
- **Application changes:** `ApplicationService.invalidate()` clears auth entries matching `auth:*:{appSlug}`

### JWT Caching

JWT auth is cached separately via `TokenService.getAppSlugs()`.

## Token Management API

All endpoints require JWT authentication.

### Create Token
```
POST /api/tokens
```
```json
{
    "application_id": "uuid",
    "name": "My API Token",
    "expires_at": "2026-12-31T00:00:00Z"
}
```
Provide either `application_id` (app token) or `user_id` (user token), not both. `name` and `expires_at` are optional.

Returns the raw token string (only shown once) and the masked record.

### List Tokens
```
GET /api/tokens
GET /api/tokens?user_id=uuid
GET /api/tokens?application_id=uuid
```
Without query params, lists all tokens in the organization. Filter by `user_id` or `application_id`.

### Get Token
```
GET /api/tokens/:id
```

### Deactivate Token
```
DELETE /api/tokens/:id
```
Deactivates the token and invalidates all associated caches.

## Key Files

| File | Description |
|------|-------------|
| `plugins/types/src/api/types.ts` | `Auth` and `TokenType` type definitions |
| `app/src/api/middleware/auth.middleware.ts` | Unified auth middleware |
| `app/src/services/auth/auth.service.ts` | Auth resolution logic and caching |
| `app/src/services/auth/holo.token.service.ts` | HoloToken generation, verification, deactivation |
| `app/src/services/auth/token.service.ts` | JWT token decoding and app slug caching |
| `app/src/services/auth/access.service.ts` | User-to-application access checks |
