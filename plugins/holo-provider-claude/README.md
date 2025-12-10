# @holokai/provider-claude

Claude (Anthropic) provider plugin for Holo LLM Gateway.

## Installation

```bash
npm install @holokai/provider-claude
```

## Usage

This plugin is automatically discovered and loaded by the Holo plugin system when installed in a Holo worker environment.

## Provider Configuration

```json
{
  "provider_type": "claude",
  "plugin_id": "@holokai/provider-claude",
  "api_key": "your-anthropic-api-key",
  "model": "claude-3-opus-20240229"
}
```

## Capabilities

- Chat completions
- Streaming responses
- Function calling (tools)
- Vision support

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
