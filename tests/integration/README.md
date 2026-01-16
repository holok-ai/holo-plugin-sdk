# Integration Tests

**REAL integration tests - NO MOCKING.**

These tests make actual HTTP requests to a running server, which proxies to real LLM APIs.

## Prerequisites

### 1. Server Must Be Running

Start the server before running tests:

```bash
npm run start
# or
npm run api:dev
```

### 2. Environment Variables

Set required environment variables:

```bash
export TEST_AUTH_TOKEN=your-test-token-here
```

Optional variables:

```bash
export TEST_BASE_URL=http://localhost:3000  # default
export TEST_TIMEOUT=30000                    # default, in milliseconds
```

### 3. Server Configuration

Your server must have valid API keys configured:

```bash
# In your .env file
OPENAI_API_KEY=sk-...
```

## Running Tests

### Run all integration tests:
```bash
npm run test:integration
```

### Run specific provider tests:
```bash
npm run test:integration -- openai
```

### Run with verbose output:
```bash
npm run test:integration -- --verbose
```

### Run in watch mode (during development):
```bash
npm run test:integration -- --watch
```

## Test Structure

```
tests/integration/
├── setup/
│   ├── config.ts          # Environment configuration
│   └── test-client.ts     # HTTP client (NO MOCKING)
├── fixtures/
│   ├── openai-requests.ts # Test request payloads
│   └── validators.ts      # Response validation helpers
├── providers/
│   └── openai.test.ts     # OpenAI integration tests
└── README.md              # This file
```

## What Gets Tested

### OpenAI Provider

**Chat Completions API:**
- ✅ Non-streaming requests
- ✅ Streaming (SSE) requests
- ✅ Function/tool calling

**Responses API:**
- ✅ Non-streaming responses
- ✅ Streaming responses with event types
- ✅ Array input format (system + user messages)

**Other:**
- ✅ Models listing endpoint

## Validation Approach

Tests validate:
1. **Response structure** - Correct schema and fields
2. **Response content** - Actual AI-generated text (partial validation)
3. **Streaming format** - SSE parsing and event types
4. **Status codes** - 200 for success

Tests do NOT:
- Mock any HTTP requests
- Mock any API responses
- Use snapshot testing (responses vary)
- Validate exact response content (AI is non-deterministic)

## Cost Considerations

⚠️ **These tests make REAL API calls and will incur costs:**

- Each test run costs approximately $0.10-0.50
- Uses gpt-4o-mini for cost efficiency
- Requests are limited to 10-50 tokens to minimize cost
- Avoid running tests repeatedly in tight loops

## Troubleshooting

### "Server not ready" error

```bash
# Check if server is running
curl http://localhost:3000/health

# Start the server
npm run start
```

### "TEST_AUTH_TOKEN is required" error

```bash
# Set the auth token
export TEST_AUTH_TOKEN=your-test-token

# Verify it's set
echo $TEST_AUTH_TOKEN
```

### "401 Unauthorized" error

Your TEST_AUTH_TOKEN may be invalid. Check:
1. Token is valid in your server configuration
2. Token has required permissions
3. Token hasn't expired

### "Timeout" errors

Increase timeout:
```bash
export TEST_TIMEOUT=60000  # 60 seconds
```

### API Key errors

Verify your server has valid API keys:
```bash
# Check .env file
cat .env | grep OPENAI_API_KEY
```

## CI/CD Integration

For automated testing in CI pipelines:

```bash
# Start server in background
npm run start &
SERVER_PID=$!

# Wait for server
sleep 5

# Run tests
npm run test:integration

# Cleanup
kill $SERVER_PID
```

## Adding New Tests

1. **Create request fixture** in `fixtures/<provider>-requests.ts`
2. **Add validation helper** in `fixtures/validators.ts` if needed
3. **Write test** in `providers/<provider>.test.ts`:

```typescript
it('should do something', async () => {
    const response = await client.post('/v1/endpoint', requestFixture);

    expect(response.status).toBe(200);
    validateStructure(response.data);
    validateContent(response.data, 'expected substring');
}, 30000);  // 30 second timeout
```

## Future Test Coverage

- [ ] Claude provider
- [ ] Ollama provider
- [ ] Error handling (401, 400, 500)
- [ ] Rate limiting behavior
- [ ] Concurrent requests
- [ ] Large payload handling
- [ ] Request timeouts

---

**Remember:** NO MOCKING. These are real integration tests.
