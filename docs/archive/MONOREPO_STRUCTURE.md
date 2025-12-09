# HoloKai Holo - Monorepo & Package Structure

## Overview

Split the monolithic application into multiple publishable NPM packages organized in a monorepo structure under the `@holokai` organization, with clear separation between **open-source** and **closed-source** components.

**Admin/Multi-tenancy**: Handled by separate Java project (not in this repo)

---

## Monorepo Structure

```
holokai-holo/                               [PUBLIC REPO - github.com/holokai/holo]
├── packages/
│   ├── core/                       📦 @holokai/core             [OPEN SOURCE]
│   ├── providers/                  📦 @holokai/providers        [OPEN SOURCE]
│   ├── queue/                      📦 @holokai/queue            [OPEN SOURCE]
│   ├── api-server/                 📦 @holokai/api-server       [OPEN SOURCE]
│   ├── worker/                     📦 @holokai/worker           [OPEN SOURCE]
│   ├── audit/                      📦 @holokai/audit            [OPEN SOURCE]
│   ├── evaluator/                  📦 @holokai/evaluator        [CLOSED SOURCE]
│   └── enterprise/                 📦 @holokai/enterprise       [CLOSED SOURCE]
├── apps/
│   ├── proxy-app/                  🚀 Deployed API Server       [CLOSED SOURCE]
│   ├── worker-app/                 🚀 Deployed Worker           [CLOSED SOURCE]
│   └── docs/                       📚 Documentation Site        [OPEN SOURCE]
├── tools/
│   └── scripts/                    Build/deploy scripts
├── package.json                    Workspace root
├── turbo.json                      Turborepo config
├── pnpm-workspace.yaml             PNPM workspaces
└── tsconfig.base.json              Shared TypeScript config
```

**Separate Repository (Not in this monorepo)**:
```
holokai-admin/                              [PRIVATE REPO - Java/Spring Boot]
├── src/main/java/com/holokai/admin/
│   ├── domain/
│   │   ├── Organization.java
│   │   ├── Application.java
│   │   └── ApiToken.java
│   ├── service/
│   │   ├── OrganizationService.java
│   │   ├── AuthService.java
│   │   └── GuardService.java
│   ├── controller/
│   │   ├── OrganizationController.java
│   │   └── AuthController.java
│   └── repository/
│       └── [JPA repositories]
└── pom.xml / build.gradle
```

---

## Package Breakdown

### 1. `@holokai/core` [OPEN SOURCE]

**Purpose**: Pure TypeScript domain logic, types, and utilities (zero Node.js dependencies)

**Contents**:
```
packages/core/
├── src/
│   ├── domain/
│   │   ├── models/
│   │   │   ├── provider.ts
│   │   │   ├── model.ts
│   │   │   └── request.ts
│   │   └── validators/
│   │       ├── provider.validator.ts
│   │       └── model.validator.ts
│   ├── types/
│   │   ├── worker.types.ts
│   │   ├── config.types.ts
│   │   └── index.ts
│   └── utils/
│       ├── parsers.ts
│       ├── pick-defined.ts
│       └── error-messages.ts
├── package.json
└── tsconfig.json
```

**Dependencies**:
- `arktype` (validation)
- Zero Node.js/runtime dependencies

**Exports**:
```json
{
  "name": "@holokai/core",
  "exports": {
    ".": "./dist/index.js",
    "./domain": "./dist/domain/index.js",
    "./types": "./dist/types/index.js",
    "./utils": "./dist/utils/index.js"
  }
}
```

**Why Open Source**: Pure business logic, types, and utilities - valuable to community

**Note**: Does NOT include organization/app/token models (those are in Java admin service)

---

### 2. `@holokai/providers` [OPEN SOURCE]

**Purpose**: Provider abstraction layer with Holo translation system + SDK clients

**Contents**:
```
packages/providers/
├── src/
│   ├── holo/                       Universal format
│   │   ├── types/
│   │   ├── validators/
│   │   ├── holo.translator.ts
│   │   ├── holo.request.factory.ts
│   │   └── holo.response.factory.ts
│   ├── claude/
│   │   ├── types/
│   │   ├── validators/
│   │   ├── translators/
│   │   │   ├── streaming/
│   │   │   └── index.ts
│   │   ├── claude.translator.ts
│   │   ├── claude.provider.ts       SDK client wrapper
│   │   └── utils/
│   ├── openai/
│   │   ├── [similar structure]
│   │   └── openai.provider.ts       SDK client wrapper
│   ├── ollama/
│   │   ├── [similar structure]
│   │   └── ollama.provider.ts       SDK client wrapper
│   ├── perplexity/
│   │   └── [similar structure]
│   ├── base/
│   │   ├── base.translator.ts
│   │   ├── base.stream.translator.ts
│   │   └── base.provider.ts         Abstract provider base
│   ├── http/
│   │   └── http.client.ts           Generic HTTP client
│   └── types/
│       ├── translator.types.ts
│       ├── provider.types.ts
│       └── client.types.ts
├── package.json
└── README.md                        Translation system docs
```

**Dependencies**:
- `@holokai/core` (types)
- `arktype` (validation)
- `@anthropic-ai/sdk`
- `openai`
- `ollama`

**Exports**:
```json
{
  "name": "@holokai/providers",
  "exports": {
    ".": "./dist/index.js",
    "./holo": "./dist/holo/index.js",
    "./claude": "./dist/claude/index.js",
    "./openai": "./dist/openai/index.js",
    "./ollama": "./dist/ollama/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

**Why Open Source**:
- Core value proposition - universal LLM abstraction
- Encourages community to add providers
- SDK wrappers are commodity (wrap public SDKs)
- No proprietary business logic

---

### 4. `@holokai/queue` [OPEN SOURCE]

**Purpose**: RabbitMQ abstraction and message handling

**Contents**:
```
packages/queue/
├── src/
│   ├── queue.service.ts
│   ├── message.ts
│   ├── types/
│   │   ├── queue.types.ts
│   │   └── message.types.ts
│   └── utils/
│       └── retry.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core` (types)
- `amqplib`

**Why Open Source**: Generic queue abstraction, no proprietary logic

---

### 5. `@holokai/api-server` [OPEN SOURCE]

**Purpose**: HTTP API server (Express routes, controllers, middleware)

**Contents**:
```
packages/api-server/
├── src/
│   ├── routes/
│   │   ├── openai.routes.ts
│   │   ├── claude.routes.ts
│   │   ├── ollama.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/
│   │   ├── base.controller.ts
│   │   ├── openai.controller.ts
│   │   ├── claude.controller.ts
│   │   └── ollama.controller.ts
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── cors.middleware.ts
│   ├── services/
│   │   ├── request.service.ts      (basic request handling)
│   │   ├── response.service.ts
│   │   └── stream.service.ts
│   ├── server.ts
│   └── types/
│       └── http.types.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core`
- `@holokai/providers`
- `@holokai/queue`
- `express`
- `body-parser`
- `morgan`

**Why Open Source**:
- Generic HTTP layer
- No proprietary auth/admin logic
- Community can extend/customize

---

### 6. `@holokai/worker` [OPEN SOURCE]

**Purpose**: Worker node for processing LLM requests

**Contents**:
```
packages/worker/
├── src/
│   ├── worker.ts
│   ├── services/
│   │   └── provider.service.ts     (provider routing)
│   ├── types/
│   │   └── worker.types.ts
│   └── factories/
│       ├── request.factory.ts
│       └── response.factory.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core`
- `@holokai/providers`
- `@holokai/client`
- `@holokai/queue`
- `tsyringe` (DI)

**Why Open Source**: Generic worker pattern, no proprietary logic

---

### 7. `@holokai/audit` [OPEN SOURCE]

**Purpose**: Audit logging service

**Contents**:
```
packages/audit/
├── src/
│   ├── audit.service.ts
│   ├── audit.server.ts
│   ├── db/
│   │   ├── request.db.ts
│   │   └── response.db.ts
│   └── types/
│       └── audit.types.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core`
- `@holokai/queue`
- `@prisma/client`
- `pg`

**Why Open Source**: Generic audit pattern, no proprietary logic

---

### 8. ~~`@holokai/admin`~~ [MOVED TO JAVA]

**Note**: Admin functionality (organizations, applications, tokens, guards, auth) is now handled by a separate Java/Spring Boot service.

**Java Admin Service** (separate repository):
```
holokai-admin/                              [PRIVATE REPO - Java/Spring Boot]
├── src/main/java/com/holokai/admin/
│   ├── domain/
│   │   ├── Organization.java
│   │   ├── Application.java
│   │   ├── ApiToken.java
│   │   ├── Provider.java
│   │   └── Model.java
│   ├── service/
│   │   ├── OrganizationService.java
│   │   ├── ApplicationService.java
│   │   ├── AuthService.java
│   │   ├── GuardService.java
│   │   └── ConfigService.java
│   ├── controller/
│   │   ├── OrganizationController.java
│   │   ├── AuthController.java
│   │   └── GuardController.java
│   ├── repository/
│   │   ├── OrganizationRepository.java
│   │   ├── ApplicationRepository.java
│   │   └── TokenRepository.java
│   ├── security/
│   │   ├── JwtAuthenticationFilter.java
│   │   └── SecurityConfig.java
│   └── messaging/
│       └── RabbitMQPublisher.java          # Publishes config to queue
└── pom.xml / build.gradle
```

**Communication with Node.js Services**:
- **RabbitMQ**: Java admin publishes config updates to queue
- **REST API**: Node.js services can query Java admin for org/app/token data
- **Shared Database**: Both can read from same PostgreSQL (write from Java only)

**Why Java**:
- Enterprise-grade Spring Boot ecosystem
- Better JPA/Hibernate for complex domain models
- Existing Java infrastructure/team
- Strong typing for multi-tenant logic

---

### 9. `@holokai/evaluator` [CLOSED SOURCE]

**Purpose**: Request/response evaluation, metrics, PR analysis

**Contents**:
```
packages/evaluator/
├── src/
│   ├── evaluators/
│   │   ├── prompt.evaluator.ts
│   │   ├── application.evaluator.ts
│   │   ├── pr-metrics.evaluator.ts
│   │   ├── webhook-classifier.ts
│   │   └── response-complete.evaluator.ts
│   ├── services/
│   │   └── evaluator.service.ts
│   ├── server/
│   │   └── evaluator.server.ts
│   ├── db/
│   │   └── evaluator.db.ts
│   ├── http/
│   │   └── admin.client.ts              # Calls Java admin REST API
│   └── types/
│       └── evaluator.types.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core`
- `@holokai/queue`
- `azure-devops-node-api` (PR metrics)
- `diff` (code diffing)
- `axios` (for Java admin API calls)

**Why Closed Source**:
- **Proprietary evaluation logic**
- **Custom metrics/analytics**
- **PR analysis algorithms**
- **Azure DevOps integration**

**Note**: Communicates with Java admin service via REST API for org/app context

---

### 10. `@holokai/enterprise` [CLOSED SOURCE]

**Purpose**: Enterprise features (SSO, RBAC, billing, compliance)

**Contents**:
```
packages/enterprise/
├── src/
│   ├── sso/
│   │   ├── saml.provider.ts
│   │   └── oauth.provider.ts
│   ├── rbac/
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   └── rbac.service.ts
│   ├── billing/
│   │   ├── usage.tracker.ts
│   │   └── billing.service.ts
│   ├── compliance/
│   │   ├── audit.exporter.ts
│   │   └── retention.policy.ts
│   └── types/
│       └── enterprise.types.ts
├── package.json
└── README.md
```

**Dependencies**:
- `@holokai/core`
- `@holokai/audit`
- `axios` (for Java admin API calls)
- SSO libraries (TBD)

**Why Closed Source**:
- **Enterprise-only features**
- **Proprietary compliance logic**
- **Billing/usage tracking**

**Note**: Integrates with Java admin service for organization/billing context

---

## Application Packages (Deployable)

### 1. `apps/proxy-app` [CLOSED SOURCE]

**Purpose**: Production API server with all features

**Contents**:
```
apps/proxy-app/
├── src/
│   ├── main.ts
│   ├── env.ts
│   ├── middleware/
│   │   └── admin-auth.middleware.ts    # Calls Java admin for JWT validation
│   └── config/
│       └── default.config.ts
├── package.json
└── Dockerfile
```

**Dependencies**:
- `@holokai/api-server`
- `@holokai/enterprise` (optional)
- `axios` (for Java admin API calls)
- `dotenv`
- `winston`

**Deployment**: Container with Express + RabbitMQ consumer

**Note**: Auth/authorization delegated to Java admin service via REST API

---

### 2. `apps/worker-app` [CLOSED SOURCE]

**Purpose**: Production worker with guards and evaluators

**Contents**:
```
apps/worker-app/
├── src/
│   ├── main.ts
│   ├── env.ts
│   └── config/
│       └── default.config.ts
├── package.json
└── Dockerfile
```

**Dependencies**:
- `@holokai/worker`
- `@holokai/evaluator`
- `axios` (for Java admin API calls)
- `dotenv`
- `winston`

**Deployment**: Container with RabbitMQ consumer

**Note**: Retrieves guard configuration from Java admin service via REST API or RabbitMQ

---

### 3. `apps/docs` [OPEN SOURCE]

**Purpose**: Documentation site (Docusaurus/Vitepress)

**Contents**:
```
apps/docs/
├── docs/
│   ├── getting-started.md
│   ├── providers/
│   ├── api/
│   └── deployment/
├── package.json
└── docusaurus.config.js
```

---

## Package Dependencies Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      OPEN SOURCE (Node.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  @holokai/core (Pure TS, no deps)                              │
│       ↑                                                         │
│       │                                                         │
│  @holokai/providers (Translators)                              │
│       ↑                                                         │
│       │                                                         │
│  @holokai/client (SDK wrappers)                                │
│       ↑                                                         │
│       │                                                         │
│  @holokai/queue (RabbitMQ abstraction)                         │
│       ↑                                                         │
│       ├──────────────┬─────────────┐                           │
│       │              │             │                           │
│  @holokai/      @holokai/     @holokai/                        │
│  api-server        worker        audit                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        ↑                  ↑
        │                  │
        │                  │ REST API / RabbitMQ
        │                  │
┌───────┴──────────────────┴───────────────────────────────────────┐
│               CLOSED SOURCE - Java Admin Service                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  holokai-admin (Spring Boot)                                    │
│  • Organization Management                                       │
│  • Application/Token Management                                  │
│  • JWT Authentication                                            │
│  • Guard Configuration                                           │
│  • RabbitMQ Publisher (config updates)                          │
│  • REST API (for Node.js services)                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
        ↑
        │
┌───────┴──────────────────────────────────────────────────────────┐
│               CLOSED SOURCE - Node.js Extensions                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @holokai/evaluator (Metrics, PR analysis)                      │
│       ↑                                                          │
│       │                                                          │
│  @holokai/enterprise (SSO, RBAC, billing)                       │
│       ↑                                                          │
│       │                                                          │
│  ┌────────────────┐              ┌────────────────┐             │
│  │ apps/proxy-app │              │ apps/worker-app│             │
│  │  (Deployable)  │              │  (Deployable)  │             │
│  └────────────────┘              └────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

### Repository 1: `holokai-holo` [PUBLIC REPO - MIT]

```
holokai-holo/                       [github.com/holokai/holo]
├── packages/
│   ├── core/                       @holokai/core
│   ├── providers/                  @holokai/providers
│   ├── client/                     @holokai/client
│   ├── queue/                      @holokai/queue
│   ├── api-server/                 @holokai/api-server
│   ├── worker/                     @holokai/worker
│   └── audit/                      @holokai/audit
├── apps/
│   └── docs/                       Documentation site
├── examples/                       Example integrations
│   ├── basic-proxy/                Simple self-hosted setup
│   ├── custom-provider/            Adding a custom provider
│   └── docker-compose/             Docker deployment
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### Repository 2: `holokai-admin` [PRIVATE REPO - Spring Boot]

```
holokai-admin/                      [github.com/holokai/admin - PRIVATE]
├── src/main/java/com/holokai/admin/
│   ├── domain/
│   ├── service/
│   ├── controller/
│   ├── repository/
│   ├── security/
│   └── messaging/
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/               Flyway migrations
├── src/test/
├── pom.xml / build.gradle
└── README.md
```

### Repository 3: `holokai-cloud` [PRIVATE REPO - Node.js Extensions]

```
holokai-cloud/                      [github.com/holokai/cloud - PRIVATE]
├── packages/
│   ├── evaluator/                  @holokai/evaluator
│   └── enterprise/                 @holokai/enterprise
├── apps/
│   ├── proxy-app/                  Production API server
│   └── worker-app/                 Production worker
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

**Integration** (holokai-cloud/package.json):
```json
{
  "dependencies": {
    "@holokai/core": "^1.0.0",
    "@holokai/providers": "^1.0.0",
    "@holokai/api-server": "^1.0.0",
    "@holokai/worker": "^1.0.0",
    "@holokai/audit": "^1.0.0",
    "@holokai/queue": "^1.0.0",
    "axios": "^1.6.0"
  }
}
```

---

## Publishing Strategy

### Open Source Packages (NPM Public)

```bash
# Published to npm public registry
@holokai/core@1.0.0
@holokai/providers@1.0.0
@holokai/client@1.0.0
@holokai/queue@1.0.0
@holokai/api-server@1.0.0
@holokai/worker@1.0.0
@holokai/audit@1.0.0
```

**Publishing**:
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### Closed Source Packages (GitHub Packages or Private NPM)

```bash
# Published to GitHub Packages (private)
@holokai/evaluator@1.0.0
@holokai/enterprise@1.0.0
```

**Publishing**:
```json
{
  "publishConfig": {
    "access": "restricted",
    "registry": "https://npm.pkg.github.com/"
  }
}
```

---

## Migration Path

### Phase 1: Create Monorepo Structure
1. Initialize Turborepo/PNPM workspace
2. Create `packages/` and `apps/` directories
3. Set up shared tooling (tsconfig, eslint, prettier)

### Phase 2: Extract Core Packages (Open Source)
1. Move `/types` → `@holokai/core`
2. Move `/providers` → `@holokai/providers`
3. Move `/utils` → `@holokai/core/utils`
4. Move `/cache/types` → `@holokai/core/domain`

### Phase 3: Extract Infrastructure (Open Source)
1. Move `/services/queue.service.ts` → `@holokai/queue`
2. Move `/api` → `@holokai/api-server`
3. Move worker logic → `@holokai/worker`
4. Move audit logic → `@holokai/audit`

### Phase 4: Extract Proprietary (Closed Source)
1. Move `/admin` → `@holokai/admin` (new private package)
2. Move evaluators → `@holokai/evaluator` (new private package)
3. Create `@holokai/enterprise` (new features)

### Phase 5: Create Deployment Apps
1. Create `apps/api-app` (combines open + closed)
2. Create `apps/worker-app` (combines open + closed)
3. Create `apps/docs` (documentation)

### Phase 6: Setup CI/CD
1. Publish open-source packages to NPM
2. Publish closed-source packages to GitHub Packages
3. Deploy apps to infrastructure

---

## Build & Tooling

### Turborepo Configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### PNPM Workspaces

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### TypeScript Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@holokai/core": ["./packages/core/src"],
      "@holokai/providers": ["./packages/providers/src"],
      "@holokai/admin": ["./packages/admin/src"]
    }
  }
}
```

---

## Benefits of This Structure

### Open Source Benefits
1. **Community Growth**: Core translation system is freely available
2. **Provider Ecosystem**: Easy for community to add new providers
3. **Transparency**: Users can audit open-source code
4. **Contributions**: Community can improve core functionality

### Closed Source Benefits
1. **IP Protection**: Multi-tenancy, guards, evaluators remain proprietary
2. **Monetization**: Enterprise features can be sold separately
3. **Competitive Advantage**: Advanced features not open-sourced

### Technical Benefits
1. **Clear Boundaries**: Each package has single responsibility
2. **Independent Versioning**: Packages evolve at different rates
3. **Selective Updates**: Users choose which packages to upgrade
4. **Easier Testing**: Packages tested in isolation
5. **Faster Builds**: Only rebuild changed packages
6. **Better Types**: Explicit dependencies via package.json

### Deployment Benefits
1. **Flexible Composition**: Apps pick which packages to include
2. **Smaller Bundles**: Only bundle needed packages
3. **Easier Scaling**: Deploy API/worker separately
4. **Feature Flags**: Include/exclude packages at build time

---

## Example: Community Usage

### Open Source User (Self-Hosted)

```bash
npm install @holokai/core @holokai/providers @holokai/api-server @holokai/worker
```

```typescript
// Custom API server
import { createServer } from '@holokai/api-server';
import { ClaudeTranslator, OpenAITranslator } from '@holokai/providers';

const app = createServer({
  providers: [ClaudeTranslator, OpenAITranslator],
  // No admin, no guards, no evaluators
});
```

### Enterprise User (Cloud Hosted)

```bash
# Uses pre-built apps/api-app and apps/worker-app
# Includes @holokai/admin, @holokai/evaluator, @holokai/enterprise
```

---

## Service Communication Architecture

### Node.js ↔ Java Admin Integration

**Communication Patterns**:

1. **REST API** (Synchronous)
```typescript
// In apps/proxy-app/src/middleware/admin-auth.middleware.ts
import axios from 'axios';

async function validateToken(token: string) {
  const response = await axios.post('http://admin-service:8080/api/auth/validate', {
    token
  });
  return response.data; // { valid: true, organizationId: '...', appSlug: '...' }
}
```

2. **RabbitMQ** (Asynchronous Config Updates)
```java
// In holokai-admin/src/main/java/messaging/RabbitMQPublisher.java
@Service
public class ConfigPublisher {
    public void publishOrgUpdate(Organization org) {
        rabbitTemplate.convertAndSend(
            "config.updates.exchange",
            "org.updated",
            new OrgUpdateEvent(org)
        );
    }
}
```

```typescript
// In apps/worker-app - listens for config updates
queueService.consume('config.updates.queue', (msg) => {
  const { type, payload } = msg;
  if (type === 'org.updated') {
    organizationCache.update(payload);
  }
});
```

3. **Shared Database** (Read-Only from Node.js)
```typescript
// Node.js services can READ from shared PostgreSQL
// But all WRITES go through Java admin REST API
const provider = await db.query('SELECT * FROM providers WHERE id = $1', [id]);
```

### Data Flow Example: LLM Request with Guards

```
1. Client → Node.js API Server (apps/proxy-app)
   ↓
2. API validates JWT by calling Java Admin REST API
   ← Java Admin validates token, returns org/app context
   ↓
3. API creates LLM request, fetches guard config from cache
   (Cache populated by RabbitMQ messages from Java Admin)
   ↓
4. API publishes request to RabbitMQ
   ↓
5. Worker consumes request, checks guards
   ↓
6. Worker calls provider (Claude/OpenAI/Ollama)
   ↓
7. Worker publishes response to RabbitMQ
   ↓
8. API consumes response, streams to client
   ↓
9. Evaluator consumes response (from separate queue)
   ↓
10. Evaluator calls Java Admin API for org context
    ← Java Admin returns org/app details
    ↓
11. Evaluator processes metrics, stores in DB
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
└────────────┬────────────────────────────────────────────────┘
             │
       ┌─────┴─────┐
       │           │
┌──────▼──────┐ ┌──▼───────────┐
│ Java Admin  │ │ Node.js API  │
│  (Spring)   │ │  (Express)   │
│   :8080     │ │    :3000     │
└──────┬──────┘ └──┬───────────┘
       │           │
       │           │
       └─────┬─────┘
             │
       ┌─────▼─────┐
       │ RabbitMQ  │
       │  :5672    │
       └─────┬─────┘
             │
       ┌─────┴────────┬──────────┬──────────┐
       │              │          │          │
   ┌───▼────┐   ┌────▼───┐  ┌───▼───┐  ┌──▼──────┐
   │Worker 1│   │Worker 2│  │Audit  │  │Evaluator│
   │(Node)  │   │(Node)  │  │(Node) │  │(Node)   │
   └────────┘   └────────┘  └───────┘  └─────────┘
       │              │          │          │
       └──────────────┴──────────┴──────────┘
                      │
                ┌─────▼─────┐
                │PostgreSQL │
                │   :5432   │
                └───────────┘
```

---

## Conclusion

This structure provides:
- ✅ Clear open/closed source separation
- ✅ Java for enterprise admin features (Spring Boot ecosystem)
- ✅ Node.js for high-performance LLM proxying (async I/O)
- ✅ Independent package versioning and deployment
- ✅ Maximum code reuse via shared open-source core
- ✅ IP protection for proprietary features
- ✅ Easy community contribution to open-source packages
- ✅ Flexible deployment options (self-hosted vs cloud)
