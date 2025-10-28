# Models API Implementation Plan

> **Navigation**: [Specification](MODELS_API_SPECIFICATION.md) · [Architecture](ARCHITECTURE.md) · [Coding Standards](CODING_STANDARDS.md)

---

## Executive Summary

This document provides a **step-by-step implementation plan** to complete the Models API specification for OpenAI, Claude, and Ollama endpoints. The plan addresses **critical bugs** in existing implementations and adds **missing functionality** to achieve SDK parity.

**Current Status**: 70% complete (OpenAI and Ollama working, Claude broken)
**Estimated Effort**: 4-6 hours
**Risk Level**: Low (no breaking changes to existing APIs)

---

## 1. Gap Analysis

### 1.1 Current State

#### ✅ Working (OpenAI)
- **File**: `src/api/controllers/openai.controller.ts:30-56`
- Implements `models()` method
- Returns all models in OpenAI format
- Correct container: `{ object: 'list', data: [...] }`
- Maps `metadata.openai` correctly
- Handles both single app and multi-app auth

#### ❌ Broken (Claude)
- **File**: `src/api/controllers/claude.controller.ts:27-54`
- **BUG**: Returns raw `Model[]` instead of `ClaudeModelInfo[]`
- **BUG**: Line 37 uses `string | any[]` (type safety violation)
- **BUG**: Line 52 accesses `.id` on `Model` (doesn't exist)
- **Missing**: No mapping to `metadata.claude`
- Container structure exists but operates on wrong data

#### ✅ Working (Ollama)
- **File**: `src/api/controllers/ollama.controller.ts:37-62`
- Implements `models()` method
- Returns all models in Ollama format
- Correct container: `{ models: [...] }`
- Maps `metadata.ollama` correctly
- Handles both single app and multi-app auth

### 1.2 Validator Issues

#### ❌ Critical Bug (Ollama Validator)
- **File**: `src/cache/validators/model.validator.ts:41-50`
- **BUG**: Lines 43, 48 expect `Date` objects
- **SPEC**: Ollama SDK returns ISO 8601 **strings**, not Date objects
- **Impact**: Will fail validation when config contains string timestamps
- **Fix**: Change `'Date'` to `'string'` for `modified_at` and `expires_at`

#### ✅ Correct (OpenAI, Claude)
- OpenAI validator matches SDK (lines 12-17)
- Claude validator matches SDK (lines 21-26)

---

## 2. Implementation Tasks

### Task 1: Fix Claude Controller (CRITICAL)

**Priority**: P0 (broken functionality)
**File**: `src/api/controllers/claude.controller.ts`
**Estimated Time**: 30 minutes

#### Changes Required

**Current Implementation** (lines 27-54):
```typescript
public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    const logger = this.mlog(this.models);
    logger.info('Getting models');
    const {auth} = req;

    if (!auth) {
        res.status(401).json({error: 'Unauthorized'});
        return;
    }

    let claudeModels: string | any[] = [];  // ❌ Type safety violation

    if (auth.organizationId && auth?.appSlug) {
        logger.debug(`Getting models for app: ${auth.appSlug}`);
        claudeModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];  // ❌ Returns Model[]
    } else if(auth.appSlugs) {
        logger.debug('No app defined, getting all models');
        claudeModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs)  // ❌ Returns Model[]
    }

    res.status(200).json({
        data: claudeModels,  // ❌ Should be ClaudeModelInfo[]
        has_more: false,
        first_id: claudeModels.length > 0 ? claudeModels[0].id : null,  // ❌ Model doesn't have .id
        last_id: claudeModels.length > 0 ? claudeModels[claudeModels.length - 1].id : null  // ❌ Model doesn't have .id
    });
}
```

**Fixed Implementation**:
```typescript
public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    const logger = this.mlog(this.models);
    logger.info('Getting models');
    const {auth} = req;

    if (!auth) {
        res.status(401).json({error: 'Unauthorized'});
        return;
    }

    let claudeModels: ClaudeModelInfo[] = [];  // ✅ Correct type

    if (auth.organizationId && auth?.appSlug) {
        logger.debug(`Getting models for app: ${auth.appSlug}`);
        const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
        claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);  // ✅ Extract metadata.claude
    } else if(auth.appSlugs) {
        logger.debug('No app defined, getting all models');
        const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
        claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);  // ✅ Extract metadata.claude
    }

    res.status(200).json({
        data: claudeModels,  // ✅ ClaudeModelInfo[]
        has_more: false,
        first_id: claudeModels.length > 0 ? claudeModels[0].id : null,  // ✅ Accesses ClaudeModelInfo.id
        last_id: claudeModels.length > 0 ? claudeModels[claudeModels.length - 1].id : null  // ✅ Accesses ClaudeModelInfo.id
    });
}
```

#### Implementation Steps

1. **Add Import** (line 9):
   ```typescript
   import {ClaudeModelInfo} from "../../cache";
   ```

2. **Fix Type Declaration** (line 37):
   ```typescript
   let claudeModels: ClaudeModelInfo[] = [];
   ```

3. **Fix Single App Branch** (lines 40-42):
   ```typescript
   const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
   claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
   ```

4. **Fix Multi-App Branch** (lines 43-45):
   ```typescript
   const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
   claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
   ```

#### Verification

**Compile Check**:
```bash
npx tsc --noEmit
```
Should pass without errors.

**Runtime Test**:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/claude/v1/models
```
Expected response:
```json
{
  "data": [
    { "id": "claude-sonnet-4-20250514", "created_at": "2025-02-19T00:00:00Z", "display_name": "Claude Sonnet 4", "type": "model" }
  ],
  "has_more": false,
  "first_id": "claude-sonnet-4-20250514",
  "last_id": "claude-sonnet-4-20250514"
}
```

---

### Task 2: Fix Ollama Validator (CRITICAL)

**Priority**: P0 (validation failure)
**File**: `src/cache/validators/model.validator.ts`
**Estimated Time**: 15 minutes

#### Problem

Ollama SDK **auto-parses** ISO 8601 strings to `Date` objects, but:
1. **REST API returns strings** (not Date objects)
2. **Moku sends strings** in configuration (JSON doesn't serialize Date)
3. **Validator expects Date** → validation fails on valid config

#### Fix

**Current Implementation** (lines 41-50):
```typescript
export const OllamaModelResponseValidator = type({
    name: 'string',
    modified_at: 'Date',  // ❌ Expects Date object
    model: 'string',
    size: 'number',
    digest: 'string',
    details: OllamaModelDetailsValidator,
    expires_at: 'Date',  // ❌ Expects Date object
    size_vram: 'number'
}) satisfies Type<OllamaModelResponse>;
```

**Fixed Implementation**:
```typescript
export const OllamaModelResponseValidator = type({
    name: 'string',
    modified_at: 'string',  // ✅ Accept ISO 8601 string
    model: 'string',
    size: 'number',
    digest: 'string',
    details: OllamaModelDetailsValidator,
    'expires_at?': 'string',  // ✅ Optional + string
    'size_vram?': 'number'  // ✅ Mark as optional (matches SDK)
}) satisfies Type<OllamaModelResponse>;
```

#### Implementation Steps

1. **Change `modified_at`** (line 43):
   ```typescript
   modified_at: 'string',
   ```

2. **Change `expires_at`** (line 48):
   ```typescript
   'expires_at?': 'string',
   ```

3. **Fix `size_vram`** (line 49):
   ```typescript
   'size_vram?': 'number'
   ```

#### Rationale

From specification (Section 7.1, Section 4.3):
> **Critical**: Ollama SDK auto-parses ISO 8601 to `Date` objects, but **our cache must store strings** to ensure REST API parity.

Moku sends config with strings:
```json
{
  "metadata": {
    "ollama": {
      "modified_at": "2025-05-10T08:06:48.639712648-07:00",  // ← String, not Date
      "expires_at": "2025-12-31T23:59:59Z"  // ← String, not Date
    }
  }
}
```

Validator must accept strings, not Date objects.

#### Verification

**Config Validation Test**:
```typescript
import { OllamaModelResponseValidator } from './model.validator';

const testData = {
  name: "llama3:8b",
  modified_at: "2025-05-10T08:06:48.639712648-07:00",  // String
  model: "llama3:8b",
  size: 4683075271,
  digest: "sha256:0a8c...",
  details: { /* ... */ }
};

const result = OllamaModelResponseValidator(testData);
// Should succeed without errors
```

---

### Task 3: Add Missing Exports (LOW PRIORITY)

**Priority**: P2 (import convenience)
**File**: `src/cache/types/index.ts`
**Estimated Time**: 5 minutes

#### Check Current Exports

Verify that `ClaudeModelInfo` is exported:
```typescript
// src/cache/types/index.ts
export * from './model';
```

If not present, add explicit export:
```typescript
export { OpenAIModel, ClaudeModelInfo, OllamaModelResponse, OllamaModelDetails } from './model';
```

---

### Task 4: Add Route Registration (VERIFICATION)

**Priority**: P1 (endpoint accessibility)
**Files**:
- `src/api/routes/openai.routes.ts`
- `src/api/routes/claude.routes.ts`
- `src/api/routes/ollama.routes.ts`

**Estimated Time**: 10 minutes per route

#### Verify Existing Routes

**Check OpenAI Routes**:
```typescript
// src/api/routes/openai.routes.ts
router.get('/models', openAIController.models);  // Should exist
```

**Check Claude Routes**:
```typescript
// src/api/routes/claude.routes.ts
router.get('/models', claudeController.models);  // Should exist
```

**Check Ollama Routes**:
```typescript
// src/api/routes/ollama.routes.ts
router.get('/tags', ollamaController.models);  // Should exist (Ollama uses /tags, not /models)
```

#### Add Missing Routes (if needed)

If any route is missing, follow this pattern:

**OpenAI**:
```typescript
import { OpenAIController } from '../controllers/openai.controller';

const openAIController = container.resolve(OpenAIController);

router.get('/models', openAIController.models);
```

**Claude**:
```typescript
import { ClaudeController } from '../controllers/claude.controller';

const claudeController = container.resolve(ClaudeController);

router.get('/models', claudeController.models);
```

**Ollama**:
```typescript
import OllamaController from '../controllers/ollama.controller';

const ollamaController = container.resolve(OllamaController);

router.get('/tags', ollamaController.models);
```

---

## 3. Testing Plan

### 3.1 Unit Tests

**Location**: `src/api/controllers/__tests__/`

#### Claude Controller Tests

Create `claude.controller.test.ts`:
```typescript
import { ClaudeController } from '../claude.controller';
import { OrganizationService } from '../../../admin/services/organization.service';
import { RequestService } from '../../../admin/services/request.service';
import { ClaudeModelInfo, Model } from '../../../cache';

describe('ClaudeController.models', () => {
  let controller: ClaudeController;
  let mockOrgService: jest.Mocked<OrganizationService>;
  let mockReqService: jest.Mocked<RequestService>;

  beforeEach(() => {
    mockOrgService = {
      getModels: jest.fn(),
      getAllModels: jest.fn()
    } as any;

    mockReqService = {} as any;

    controller = new ClaudeController(mockReqService, mockOrgService);
  });

  it('should return empty list when no models available', async () => {
    mockOrgService.getModels.mockReturnValue([]);

    const req = {
      auth: { organizationId: 'org1', appSlug: 'app1' }
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await controller.models(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: [],
      has_more: false,
      first_id: null,
      last_id: null
    });
  });

  it('should return all models in Claude format', async () => {
    const cachedModels: Model[] = [
      {
        name: 'Claude Sonnet 4',
        accessModel: 'claude-sonnet-4',
        providerName: 'CLAUDE',
        metadata: {
          claude: {
            id: 'claude-sonnet-4-20250514',
            created_at: '2025-02-19T00:00:00Z',
            display_name: 'Claude Sonnet 4',
            type: 'model'
          }
        }
      },
      {
        name: 'GPT-4',
        accessModel: 'gpt-4',
        providerName: 'OPENAI',
        metadata: {
          claude: {
            id: 'gpt-4',
            created_at: '2023-06-27T19:13:30Z',
            display_name: 'GPT-4 (via Holo)',
            type: 'model'
          }
        }
      }
    ];

    mockOrgService.getModels.mockReturnValue(cachedModels);

    const req = {
      auth: { organizationId: 'org1', appSlug: 'app1' }
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await controller.models(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [
        {
          id: 'claude-sonnet-4-20250514',
          created_at: '2025-02-19T00:00:00Z',
          display_name: 'Claude Sonnet 4',
          type: 'model'
        },
        {
          id: 'gpt-4',
          created_at: '2023-06-27T19:13:30Z',
          display_name: 'GPT-4 (via Holo)',
          type: 'model'
        }
      ],
      has_more: false,
      first_id: 'claude-sonnet-4-20250514',
      last_id: 'gpt-4'
    });
  });

  it('should reject requests without auth', async () => {
    const req = { auth: null } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await controller.models(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
});
```

#### Run Tests

```bash
npm test -- claude.controller.test.ts
```

### 3.2 Integration Tests

**Manual Testing Sequence**:

1. **Start Server**:
   ```bash
   npm run dev
   ```

2. **Test OpenAI Endpoint**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/openai/v1/models
   ```
   Expected: `{ object: 'list', data: [...] }`

3. **Test Claude Endpoint**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/claude/v1/models
   ```
   Expected: `{ data: [...], has_more: false, first_id: "...", last_id: "..." }`

4. **Test Ollama Endpoint**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/ollama/tags
   ```
   Expected: `{ models: [...] }`

### 3.3 Contract Tests (SDK Parity)

**Compare with Real SDK**:

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';

// Test OpenAI
const openaiClient = new OpenAI({ baseURL: 'http://localhost:3000/api/openai/v1', apiKey: 'test' });
const openaiModels = await openaiClient.models.list();
console.log('OpenAI structure:', openaiModels);
// Should match: { object: 'list', data: Model[] }

// Test Claude
const claudeClient = new Anthropic({ baseURL: 'http://localhost:3000/api/claude/v1', apiKey: 'test' });
const claudeModels = await claudeClient.models.list();
console.log('Claude structure:', claudeModels);
// Should match: { data: ModelInfo[], has_more: boolean, first_id, last_id }

// Test Ollama
const ollamaClient = new Ollama({ host: 'http://localhost:3000/api/ollama' });
const ollamaModels = await ollamaClient.list();
console.log('Ollama structure:', ollamaModels);
// Should match: { models: ModelResponse[] }
```

---

## 4. Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript compilation errors resolved (`npm run build`)
- [ ] Unit tests passing (`npm test`)
- [ ] Integration tests passing (manual curl tests)
- [ ] No new ESLint warnings (`npm run lint`)
- [ ] Code reviewed by team member

### Configuration Update

**Moku must send complete metadata** for all three providers per model:

Example configuration message:
```json
{
  "configType": "APPLICATION",
  "action": "NEW",
  "data": [{
    "urlSlug": "my-app",
    "organizationId": "org_123",
    "models": [{
      "name": "GPT-4",
      "accessModel": "gpt-4",
      "providerName": "OPENAI",
      "metadata": {
        "openai": { "id": "gpt-4", "created": 1687882410, "object": "model", "owned_by": "openai" },
        "claude": { "id": "gpt-4", "created_at": "2023-06-27T19:13:30Z", "display_name": "GPT-4 (via Holo)", "type": "model" },
        "ollama": { "name": "gpt-4", "model": "gpt-4", "modified_at": "2023-06-27T19:13:30Z", "size": 0, "digest": "sha256:abc", "details": {...} }
      }
    }]
  }]
}
```

**Validation**: All three metadata slots **must** be populated per model.

### Post-Deployment

- [ ] Monitor logs for validation errors (`holo.config.validation_error`)
- [ ] Check metrics for endpoint usage (`holo.api.models.request`)
- [ ] Verify no 500 errors on models endpoints
- [ ] Test with real client SDKs (OpenAI, Claude, Ollama)

---

## 5. Risks & Mitigations

### Risk 1: Incomplete Metadata

**Description**: Moku sends models without all three metadata slots populated

**Impact**: Controllers will throw runtime error when accessing `metadata.claude` on models that only have `metadata.openai`

**Mitigation**:
1. **Validation at Config Ingestion**: Add validator to ensure all three slots present
2. **Null Checks in Controllers**: Add defensive null checking:
   ```typescript
   claudeModels = allModels
     .filter(m => m.metadata?.claude)  // Filter out models without claude metadata
     .map(m => m.metadata!.claude as ClaudeModelInfo);
   ```
3. **Monitoring**: Alert on config validation failures

**Implementation** (add to `ConfigService.validateConfig`):
```typescript
// Validate that all models have complete metadata
for (const model of application.models) {
  if (!model.metadata?.openai || !model.metadata?.claude || !model.metadata?.ollama) {
    logger.warn('Model missing provider metadata', { model: model.name });
  }
}
```

### Risk 2: Date vs String Inconsistency

**Description**: Ollama metadata contains Date objects instead of strings

**Impact**: Validator rejects valid config, controllers return Date objects (breaks JSON serialization)

**Mitigation**:
1. **Validator Fix**: Already addressed in Task 2
2. **Serialization Guard**: Add JSON stringify test in CI
3. **Moku Contract**: Document that Moku must send strings, not Date objects

### Risk 3: Breaking Existing Clients

**Description**: Claude endpoint currently returns `Model[]`, changing to `ClaudeModelInfo[]` breaks clients

**Impact**: Clients parsing old format will fail

**Mitigation**:
1. **Check Usage**: Review logs for existing Claude `/models` usage (likely none due to bug)
2. **Versioning**: If needed, add `/v2/models` endpoint, keep old one with deprecation warning
3. **Communication**: Announce breaking change in release notes

**Assessment**: **LOW RISK** - Current implementation is broken (returns wrong data), no clients can be using it correctly.

---

## 6. Success Criteria

### Functional

- [ ] All three controllers (`OpenAI`, `Claude`, `Ollama`) return provider-native formats
- [ ] Controllers handle both single-app and multi-app auth correctly
- [ ] Empty model lists return correct empty containers
- [ ] Pagination metadata correct for Claude (has_more, first_id, last_id)
- [ ] 401 returned for missing auth on all endpoints

### Technical

- [ ] Zero TypeScript compilation errors
- [ ] All unit tests passing (100% coverage on controller methods)
- [ ] No runtime errors in logs after deployment
- [ ] Response times <50ms (cached data, no DB queries)

### Compliance

- [ ] Responses byte-for-byte identical to native SDK responses
- [ ] Validators accept exactly what Moku sends (no validation failures)
- [ ] Follows coding standards (DI, logging, error handling patterns)
- [ ] Documentation updated to reflect implementation

---

## 7. Timeline

| Task | Owner | Duration | Dependencies | Status |
|------|-------|----------|--------------|--------|
| **Task 1**: Fix Claude Controller | Dev | 30 min | None | Not Started |
| **Task 2**: Fix Ollama Validator | Dev | 15 min | None | Not Started |
| **Task 3**: Verify Exports | Dev | 5 min | None | Not Started |
| **Task 4**: Verify Routes | Dev | 10 min | Task 1 | Not Started |
| **Testing**: Unit Tests | Dev | 1 hour | Task 1-4 | Not Started |
| **Testing**: Integration Tests | Dev | 30 min | Task 1-4 | Not Started |
| **Review**: Code Review | Team | 30 min | Testing | Not Started |
| **Deploy**: Staging | Ops | 15 min | Review | Not Started |
| **Deploy**: Production | Ops | 15 min | Staging | Not Started |

**Total Estimated Time**: 4-6 hours (including testing and deployment)

---

## 8. Appendix

### A. Quick Reference - Controller Pattern

All three controllers follow this pattern:

```typescript
@injectable()
export class ProviderController extends BaseController {
  constructor(
    private requestService: RequestService,
    private organizationService: OrganizationService
  ) {
    super();
  }

  public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    const logger = this.mlog(this.models);
    logger.info('Getting models');
    const {auth} = req;

    // 1. Auth check
    if (!auth) {
      res.status(401).json({error: 'Unauthorized'});
      return;
    }

    let providerModels: ProviderModelType[] = [];

    // 2. Fetch models (handle both single and multi-app)
    if (auth.organizationId && auth?.appSlug) {
      logger.debug(`Getting models for app: ${auth.appSlug}`);
      const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
      providerModels = allModels.map(m => m.metadata!.provider as ProviderModelType);
    } else if(auth.appSlugs) {
      logger.debug('No app defined, getting all models');
      const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
      providerModels = allModels.map(m => m.metadata!.provider as ProviderModelType);
    }

    // 3. Return in provider-native container
    res.status(200).json({
      // Provider-specific format
    });
  }
}
```

### B. Configuration Example

Moku configuration for one model with all three provider metadata:

```json
{
  "configType": "APPLICATION",
  "action": "NEW",
  "data": [{
    "urlSlug": "my-app",
    "organizationId": "org_123",
    "providerType": "OPENAI",
    "models": [{
      "name": "GPT-4",
      "accessModel": "gpt-4",
      "providerName": "OPENAI",
      "metadata": {
        "openai": {
          "id": "gpt-4",
          "created": 1687882410,
          "object": "model",
          "owned_by": "openai"
        },
        "claude": {
          "id": "gpt-4",
          "created_at": "2023-06-27T19:13:30Z",
          "display_name": "GPT-4 (via Holo)",
          "type": "model"
        },
        "ollama": {
          "name": "gpt-4",
          "model": "gpt-4",
          "modified_at": "2023-06-27T19:13:30Z",
          "size": 0,
          "digest": "sha256:abc123",
          "details": {
            "parent_model": "",
            "format": "gguf",
            "family": "gpt",
            "families": ["gpt"],
            "parameter_size": "175B",
            "quantization_level": "fp16"
          }
        }
      }
    }]
  }]
}
```

### C. Coding Standards Compliance

This implementation follows all standards from `CODING_STANDARDS.md`:

- ✅ **DI Pattern**: All controllers use `@injectable()` decorator
- ✅ **Logging**: Uses `this.mlog(this.methodName)` pattern
- ✅ **Validation**: ArkType validators at config boundaries
- ✅ **Type Safety**: No `any` types, explicit return types
- ✅ **Error Handling**: Uses `BaseController.handleError()`
- ✅ **Async/Await**: No promise chains
- ✅ **Naming**: Follows camelCase, PascalCase conventions
- ✅ **Comments**: JSDoc for public methods (controller methods)

---

**Version**: 1.0
**Last Updated**: 2025-10-12
**Status**: READY FOR IMPLEMENTATION
