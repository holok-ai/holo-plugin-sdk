# Publishing Guide

This guide explains how to publish the Holokai packages to npm.

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com/signup
2. **Organization access**: Member of `@holokai` organization on npm
3. **Authentication**:

```bash
npm login
```

## Pre-publish Checklist

1. All packages build:
```bash
npm run build --workspaces
```

2. All tests pass:
```bash
npm run test:workspaces
```

3. Version numbers updated in each `package.json`:
   - `plugins/types/package.json`
   - `plugins/sdk/package.json`
   - `plugins/holo-provider-claude/package.json`
   - `plugins/holo-provider-openai/package.json`
   - `plugins/holo-provider-ollama/package.json`

## Publishing Order

Publish in dependency order: **types → sdk → providers**.

### 1. Publish Types

```bash
cd plugins/types && npm publish
```

### 2. Publish SDK

```bash
cd plugins/sdk && npm publish
```

### 3. Publish Provider Plugins

```bash
cd plugins/holo-provider-claude && npm publish
cd plugins/holo-provider-openai && npm publish
cd plugins/holo-provider-ollama && npm publish
```

## Testing Before Publishing

### Dry Run

```bash
cd plugins/sdk
npm publish --dry-run
```

### Test with npm pack

```bash
cd plugins/sdk
npm pack
tar -tzf holokai-sdk-*.tgz
```

## Version Management

We follow semantic versioning:

- **Patch** (0.1.X): Bug fixes
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

```bash
cd plugins/sdk
npm version patch|minor|major
```

## Post-publish Verification

Check on npm:
- https://www.npmjs.com/package/@holokai/types
- https://www.npmjs.com/package/@holokai/sdk
- https://www.npmjs.com/package/@holokai/holo-provider-claude
- https://www.npmjs.com/package/@holokai/holo-provider-openai
- https://www.npmjs.com/package/@holokai/holo-provider-ollama

Test installation:
```bash
mkdir test-project && cd test-project
npm init -y
npm install @holokai/sdk @holokai/holo-provider-claude
```

## Troubleshooting

### Access Denied

```bash
npm access ls-collaborators @holokai/sdk
```

### Build Errors

```bash
npm run build --workspaces
```
