# Git Hooks Documentation

This directory contains git hooks managed by Husky to enforce code quality standards.

## Hooks Overview

### Pre-commit Hook

Runs before each commit to ensure code quality:

- **Linting**: Checks TypeScript/JavaScript code style
- **Type Checking**: Validates TypeScript types
- **Formatting**: Applies prettier formatting to changed files
- **Unit Tests**: Runs fast unit tests (excludes integration tests)

### Commit-msg Hook

Validates commit messages against our standards:

- Enforces Conventional Commits format
- Validates commit types (feat, fix, docs, etc.)
- Ensures proper message structure
- Prevents WIP commits on protected branches

## Emergency Override

In rare emergency situations, you can bypass hooks:

```bash
# Bypass pre-commit hooks
git commit --no-verify -m "fix: emergency hotfix for production"

# Or using the shorthand
git commit -n -m "fix: emergency hotfix for production"
```

**⚠️ IMPORTANT**: When bypassing hooks:

1. Document the reason in your commit message
2. Reference the incident or emergency ticket
3. Create a follow-up task to address any skipped checks
4. Use this option VERY sparingly

Example emergency commit:

```bash
git commit --no-verify -m "fix(core): emergency patch for memory leak

EMERGENCY: Production servers experiencing OOM crashes.
Bypassing checks due to critical incident INC-2345.
Follow-up cleanup tracked in JIRA-678.

Refs INC-2345"
```

## Performance Tips

The hooks are optimized for performance:

- Only modified files are checked (via lint-staged)
- Integration tests are skipped in pre-commit
- Type checking runs in parallel with linting

If hooks are still slow:

1. Ensure you're not modifying unnecessary files
2. Consider splitting large commits into smaller ones
3. Run `npm test` locally before committing to catch issues early

## Troubleshooting

### Hook not running

```bash
# Reinstall hooks
npx husky install

# Verify hooks are executable
ls -la .husky/
```

### Lint errors

```bash
# Auto-fix many lint issues
npm run lint:fix
```

### Type errors

```bash
# Check types without emitting
npm run type-check
```

### Test failures

```bash
# Run tests locally
npm test

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Commit message rejected

```bash
# Use the template for guidance
git config commit.template .gitmessage

# View the standards
cat docs/git-hygiene-standards.md
```

## Configuration Files

- `.husky/pre-commit`: Pre-commit hook script
- `.husky/commit-msg`: Commit message validation hook
- `.lintstagedrc.json`: Configuration for lint-staged
- `commitlint.config.js`: Commit message rules
- `.prettierrc`: Code formatting rules

## Related Documentation

- [Git Hygiene Standards](../docs/git-hygiene-standards.md)
- [Definition of Done](../docs/definition-of-done.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Support

If you encounter issues with hooks:

1. Check this documentation
2. Review error messages carefully (they include fix suggestions)
3. Ask the Senior Developer or QA Engineer for assistance
4. Create a ticket if you discover a bug in the hook configuration
