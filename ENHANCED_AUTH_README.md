# Enhanced Authentication with Token Caching

This implementation adds a caching layer to the JWT authentication system that integrates with an admin service for token refresh and URL slug validation.

## How It Works

1. **Token Extraction**: The middleware extracts JWT tokens from `x-api-key` header or `Authorization: Bearer` header
2. **Cache Check**: Checks if the token is already cached with its associated URL slugs
3. **Token Refresh**: If not cached, makes a POST request to `${MOKU_URL}/api/auth/token/refresh` with the original token
4. **JWT Validation**: Validates the returned access token and extracts URL slugs from claims
5. **Cache Storage**: Stores the mapping of original token → URL slugs in cache (1 hour TTL)
6. **AppId Validation**: Checks if the requested `appId` from the URL is in the user's allowed URL slugs
7. **Request Processing**: If valid, attaches user info and URL slugs to the request and continues

## Configuration

Add the following environment variable:

```bash
MOKU_URL=https://your-admin-service.com
```

## Usage

### For routes that require caching authentication:
```typescript
import { authenticateJWTWithCache } from '../middleware/enhanced-auth.middleware';

router.post('/:provider/:appId/*', authenticateJWTWithCache, controller.method);
```

### For optional authentication:
```typescript
import { optionalAuthWithCache } from '../middleware/enhanced-auth.middleware';

router.get('/some-optional-route', optionalAuthWithCache, controller.method);
```

### For backward compatibility (no caching):
```typescript
import { authenticateJWT } from '../middleware/enhanced-auth.middleware';

router.post('/legacy-route', authenticateJWT, controller.method);
```

## Request Object Extensions

The middleware adds the following properties to the request object:

```typescript
interface HttpApiRequest {
  user?: JWTPayload;           // Original JWT payload
  applicationId?: string;       // Extracted from URL params
  urlSlugs?: string[];         // Array of allowed URL slugs from cache
}
```

## Admin API Contract

The middleware expects the admin service to provide:

**POST** `${MOKU_URL}/api/auth/token/refresh`

Request:
```json
{
  "apiKey": "original-jwt-token"
}
```

Response:
```json
{
  "accessToken": "new-jwt-token-with-urlSlugs-claims"
}
```

The `accessToken` should be a valid JWT containing:
```json
{
  "userId": "user-id",
  "email": "user@example.com", 
  "urlSlugs": ["app1", "app2", "app3"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Handling

- **401**: No token provided
- **403**: Invalid token, token refresh failed, or appId not in urlSlugs
- **400**: Invalid provider or other client errors

## Performance Benefits

- **Caching**: Reduces external API calls by caching token-to-urlSlugs mappings
- **Reduced Latency**: Subsequent requests with cached tokens skip the refresh call
- **Automatic Expiration**: Cached tokens expire after 1 hour, ensuring fresh permissions

## Security Features

- **JWT Validation**: Both original and refreshed tokens are cryptographically verified
- **Automatic Refresh**: Tokens are refreshed transparently without user intervention
- **Access Control**: AppId validation ensures users can only access authorized applications
- **Memory Management**: Cache has limits to prevent memory exhaustion