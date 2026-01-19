- Never comment unless the code is not self explanatory

## ArkType Validator Implementation Rules

When implementing ArkType validators:
1. ALWAYS use `satisfies Type<TypeName>` on every validator - NEVER use `any` or flexible types
2. NEVER use `Record<string, unknown>` as a shortcut - always create proper validators for nested types
3. NEVER use `type('string')` for union types - look up the actual enum/literal values
4. Start with the most basic types first, then build up to complex ones that depend on them
5. ALWAYS look at the ACTUAL type definition in node_modules/.d.ts files before implementing
6. Copy the exact structure from the SDK types - don't guess, assume, or make up field types
7. Pay attention to required vs optional fields (no `?` means required)
8. When a validator doesn't satisfy the type, fix the validator to match the actual type, never change to `any`