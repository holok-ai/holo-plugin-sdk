# Security Policy

**Last updated**: [Date]
**Security contact**: [security@example.com]

## Overview

This document defines security requirements, approved patterns, and incident response procedures for this project.

## Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:
1. Email security team at: [security@example.com]
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response time**: We will respond within **48 hours**.

## Security Requirements

### Authentication

#### Password Requirements
- Minimum length: 12 characters
- Must contain: uppercase, lowercase, number, special character
- Hash with bcrypt (12+ rounds)
- Never store plaintext passwords

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### Session Management
- Use HTTP-only cookies for tokens
- Secure flag enabled in production
- SameSite=Strict or Lax
- Session expiration: 24 hours
- Refresh token expiration: 7 days

```typescript
res.cookie("session_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
});
```

#### Multi-Factor Authentication (MFA)
- Required for admin accounts
- Optional but recommended for regular users
- Use TOTP (Time-based One-Time Password)
- Provide backup codes

### Authorization

#### Role-Based Access Control (RBAC)
- Define clear roles: Admin, User, Guest
- Check permissions at service layer, not just UI
- Principle of least privilege

```typescript
enum UserRole {
  Admin = "ADMIN",
  User = "USER",
  Guest = "GUEST"
}

function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

#### Resource-Level Authorization
- Verify user owns resource before modifying
- Don't trust client-side IDs

```typescript
async function updatePost(postId: string, userId: string, data: UpdatePostData) {
  const post = await getPostById(postId);

  if (post.authorId !== userId) {
    throw new ForbiddenError("You don't own this post");
  }

  await updatePostData(postId, data);
}
```

### Input Validation

#### Validate All User Input
- Use schema validation (Zod, Yup, Joi)
- Validate at API boundary
- Reject invalid input with clear errors

```typescript
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional()
});

app.post("/users", async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  // Use result.data
});
```

#### Sanitize Output
- Escape HTML before rendering
- Use Content Security Policy (CSP)
- Sanitize data for different contexts (HTML, SQL, JSON)

```typescript
import DOMPurify from "isomorphic-dompurify";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em"],
    ALLOWED_ATTR: []
  });
}
```

### SQL Injection Prevention

#### Always Use Parameterized Queries
```typescript
// Good - Parameterized query
const user = await db.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);

// Bad - String concatenation (SQL injection!)
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

#### Use ORM/Query Builder
```typescript
// Using Prisma
const user = await prisma.user.findUnique({
  where: { email }
});

// Using Knex
const user = await knex("users")
  .where({ email })
  .first();
```

### Cross-Site Scripting (XSS) Prevention

#### Escape User-Generated Content
```typescript
// React automatically escapes
<div>{userInput}</div>  // Safe

// Dangerous - bypasses escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Unsafe!
```

#### Content Security Policy (CSP)
```typescript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

### Cross-Site Request Forgery (CSRF) Prevention

#### Use CSRF Tokens
```typescript
import csrf from "csurf";

const csrfProtection = csrf({ cookie: true });

app.post("/api/users", csrfProtection, (req, res) => {
  // Handle request
});
```

#### SameSite Cookies
```typescript
res.cookie("session", token, {
  sameSite: "strict"  // Prevents CSRF
});
```

### Secrets Management

#### Never Hardcode Secrets
```typescript
// Bad - Hardcoded secret
const apiKey = "sk_live_abc123xyz";

// Good - Environment variable
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY not configured");
}
```

#### Environment Variables
- Use `.env` files for development
- Never commit `.env` to version control
- Add `.env` to `.gitignore`
- Use secrets manager in production (AWS Secrets Manager, Azure Key Vault, etc.)

#### Rotate Secrets Regularly
- API keys: Every 90 days
- Passwords: On compromise
- Certificates: Before expiration

### Cryptography

#### Approved Algorithms
- **Hashing**: bcrypt (passwords), SHA-256 (general)
- **Encryption**: AES-256-GCM
- **Key derivation**: PBKDF2, Argon2

#### Prohibited Algorithms
- ❌ MD5 (broken)
- ❌ SHA-1 (weak)
- ❌ DES, 3DES (weak)
- ❌ RC4 (broken)

```typescript
import crypto from "crypto";

function encrypt(plaintext: string, key: Buffer): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encrypted,
    iv: iv.toString("hex")
  };
}
```

### Rate Limiting

#### API Rate Limits
- Prevent brute force attacks
- Prevent DoS attacks
- Return 429 Too Many Requests

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later"
});

app.use("/api/", limiter);
```

#### Authentication Rate Limits
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.post("/api/auth/login", authLimiter, loginHandler);
```

### HTTPS/TLS

#### Production Requirements
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use TLS 1.2 or higher
- Strong cipher suites only

```typescript
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

#### HTTP Security Headers
```typescript
import helmet from "helmet";

app.use(helmet());  // Sets multiple security headers

// Or manually:
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
```

### Dependency Security

#### Keep Dependencies Updated
- Run `npm audit` regularly
- Update dependencies with security patches
- Use Dependabot or Renovate for automation

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may cause breaking changes)
npm audit fix --force
```

#### Pin Dependency Versions
```json
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "zod": "^3.22.4"      // Minor/patch updates OK
  }
}
```

### Logging and Monitoring

#### What to Log
- Authentication attempts (success and failure)
- Authorization failures
- Input validation failures
- Errors and exceptions
- Security-relevant events

#### What NOT to Log
- Passwords
- API keys
- Credit card numbers
- Social security numbers
- Other PII/sensitive data

```typescript
// Good
logger.info("User login attempt", { userId: user.id, email: user.email });

// Bad
logger.info("User login", { password: user.password });  // Never log passwords!
```

#### Log Format
```typescript
logger.info({
  event: "user_login",
  userId: "123",
  ip: req.ip,
  userAgent: req.headers["user-agent"],
  timestamp: new Date().toISOString()
});
```

### Database Security

#### Connection Security
- Use TLS for database connections
- Restrict database access by IP
- Use strong passwords
- Rotate credentials regularly

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca-cert.pem")
  }
});
```

#### Principle of Least Privilege
- Application should not use root/admin DB user
- Grant only necessary permissions
- Use separate users for read-only operations

#### Data Encryption
- Encrypt sensitive data at rest
- Use database-level encryption or application-level encryption
- Store encryption keys separately from data

```typescript
import crypto from "crypto";

function encryptField(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`;
}
```

### File Upload Security

#### Validate File Types
- Check MIME type and file extension
- Scan for malware
- Limit file size

```typescript
import multer from "multer";
import path from "path";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
    } else {
      cb(null, true);
    }
  }
});
```

#### Store Files Securely
- Don't serve files from application directory
- Use unique, random filenames
- Set appropriate permissions
- Use cloud storage (S3, Azure Blob) when possible

### API Security

#### Authentication
- Use JWT or OAuth2
- Include token in Authorization header
- Validate token on every request

```typescript
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});
```

#### API Keys
- Generate cryptographically random keys
- Hash API keys before storing
- Allow key rotation
- Log API key usage

```typescript
import crypto from "crypto";

function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
```

## Incident Response

### Security Incident Procedure

1. **Detect**: Identify potential security incident
2. **Contain**: Limit damage and prevent spread
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerability and restore service
5. **Document**: Record incident details and lessons learned
6. **Notify**: Inform affected users (if required by law)

### Emergency Contacts
- Security team: [security@example.com]
- On-call engineer: [Link to PagerDuty/etc.]
- Legal team: [legal@example.com]

### Incident Severity Levels

**Critical (P0)**
- Active data breach
- System-wide compromise
- Response time: Immediate

**High (P1)**
- Potential data exposure
- Critical vulnerability
- Response time: 1 hour

**Medium (P2)**
- Limited vulnerability
- No immediate risk
- Response time: 4 hours

**Low (P3)**
- Minor issue
- Response time: 24 hours

## Security Testing

### Automated Testing
- Run security scanners in CI/CD
- Dependency vulnerability scanning (npm audit)
- Static analysis (ESLint security rules)
- SAST tools (Snyk, SonarQube)

### Manual Testing
- Penetration testing: Annually
- Code review: Every PR
- Security audit: Quarterly

## Compliance

### Data Protection Regulations
- GDPR (EU)
- CCPA (California)
- HIPAA (Healthcare, if applicable)

### Requirements
- Privacy policy published
- Cookie consent implemented
- Data retention policy defined
- Data deletion process available

## Security Checklist

Before deploying to production:

- [ ] All dependencies are up to date
- [ ] No hardcoded secrets in code
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Authentication and authorization tested
- [ ] Logging configured (no sensitive data)
- [ ] Error messages don't expose internals
- [ ] Database credentials rotated
- [ ] Backup and recovery tested

## Security Training

All developers must:
- Complete OWASP Top 10 training
- Review this security policy
- Participate in security code reviews
- Report security concerns immediately

---

**Questions?** Contact the security team at [security@example.com]
