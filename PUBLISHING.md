# Publishing Guide

This guide explains how to publish the Holokai SDK and provider plugins to npm.

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com/signup if you don't have one
2. **Organization access**: You need to be a member of the `@holokai` organization on npm
3. **Authentication**: Login to npm on your machine

```bash
npm login
```

## Pre-publish Checklist

Before publishing, ensure:

1. All packages build successfully:
```bash
npm run build:plugins
```

2. All tests pass:
```bash
npm run test:workspaces
```

3. Version numbers are updated appropriately in each package.json:
   - `plugins/sdk/package.json`
   - `plugins/holo-provider-claude/package.json`
   - `plugins/holo-provider-openai/package.json`
   - `plugins/holo-provider-ollama/package.json`

4. CHANGELOG.md files are updated with the new version changes

## Publishing Order

**Important**: Always publish the SDK before the provider plugins, as they depend on it.

### 1. Publish the SDK

```bash
npm run publish:sdk
```

Or manually:
```bash
cd plugins/sdk
npm publish
```

### 2. Publish Provider Plugins

After the SDK is published, publish the provider plugins:

```bash
# Publish all providers
npm run publish:claude
npm run publish:openai
npm run publish:ollama

# Or all at once (after SDK is published)
npm run publish:all
```

## Testing Before Publishing

### Test with npm pack

Create tarballs to inspect what will be published:

```bash
npm run pack:all
```

This creates `.tgz` files in each plugin directory. You can:

1. Inspect the contents:
```bash
tar -tzf plugins/sdk/holokai-sdk-*.tgz
```

2. Test local installation:
```bash
mkdir test-install
cd test-install
npm init -y
npm install ../plugins/sdk/holokai-sdk-*.tgz
npm install ../plugins/holo-provider-claude/holokai-holo-provider-claude-*.tgz
```

### Dry Run

Test what would be published without actually publishing:

```bash
cd plugins/sdk
npm publish --dry-run
```

## Version Management

We follow semantic versioning (semver):

- **Patch** (0.1.X): Bug fixes, no breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

Update versions before publishing:

```bash
cd plugins/sdk
npm version patch|minor|major
```

## Post-publish Verification

After publishing, verify the packages:

1. Check on npm registry:
   - https://www.npmjs.com/package/@holokai/sdk
   - https://www.npmjs.com/package/@holokai/holo-provider-claude
   - https://www.npmjs.com/package/@holokai/holo-provider-openai
   - https://www.npmjs.com/package/@holokai/holo-provider-ollama

2. Test installation in a fresh project:
```bash
mkdir test-project
cd test-project
npm init -y
npm install @holokai/sdk
npm install @holokai/holo-provider-claude
```

3. Test importing:
```typescript
import { BaseProvider } from '@holokai/sdk';
import { ClaudeProvider } from '@holokai/holo-provider-claude';
```

## Troubleshooting

### Access Denied

If you get an access denied error:
```bash
npm access ls-collaborators @holokai/sdk
```

Contact the organization owner to be added as a maintainer.

### Wrong Version Published

If you published the wrong version:
```bash
npm unpublish @holokai/sdk@<version>
```

**Note**: You can only unpublish within 72 hours, and it's discouraged. Better to publish a new version.

### Build Errors

If builds fail:
```bash
npm run clean:workspaces
npm install
npm run build:plugins
```

## CI/CD Publishing

For automated publishing via GitHub Actions, you'll need:

1. Create npm automation token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add as GitHub secret: `NPM_TOKEN`
3. Create `.github/workflows/publish.yml`

Example workflow:
```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build:plugins
      - run: npm run test:workspaces
      - run: npm run publish:all
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```
