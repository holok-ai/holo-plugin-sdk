# @holokai/provider-openai

OpenAI provider plugin for Holo LLM Gateway.

## Installation

```bash
npm install @holokai/provider-openai
```

## Usage

This plugin is automatically discovered and loaded by the Holo plugin system when installed in a Holo worker
environment.

## Provider Configuration

```json
{
  "provider_type": "openai",
  "plugin_id": "@holokai/provider-openai",
  "api_key": "your-openai-api-key",
  "model": "gpt-4"
}
```

## Capabilities

- Chat completions
- Streaming responses
- Function calling
- Vision support
- Audio support

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run integration tests
npm run test:integration
```

## License

MIT
