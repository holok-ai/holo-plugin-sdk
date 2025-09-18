# Translator Architecture

This document explains the sophisticated chain-of-translators pattern used throughout the provider translation system to convert between Holo (portable) types and provider-specific types.

## 🏗️ **Core Architecture**

The translation system uses a formal pipeline architecture with multiple components working together:

### **Key Components**

| Component | Purpose | Example |
|-----------|---------|---------|
| `FieldTranslator<TSource, TTarget>` | Main translation orchestrator for a specific field/object type | `ClaudeToolTranslator` |
| `TranslateFunc<TSource, TTarget>` | Individual field transformation functions | `fromToolParametersTranslator` |
| `Guard<T>` | Validation/filtering mechanism with business logic | `customToolOnlyGuard` |
| **Validators** | Input/output validation using arktype | `HoloToolValidator`, `ClaudeToolUnionValidator` |

## 🔧 **Translation Chain Structure**

```typescript
export const ClaudeToolTranslator = new FieldTranslator<HoloTool, ClaudeToolUnion>(
    HoloToolValidator,              // Input validator (arktype)
    ClaudeToolUnionValidator,       // Output validator (arktype)
    [fromToolParametersTranslator], // Holo → Claude transformers (array)
    [toToolParameterTranslator],    // Claude → Holo transformers (array)
    [],                            // Pre-transform guards for Holo -> Claude (array)
    [customToolOnlyGuard]          // Pre-transform guards Claude -> Holo (array)
)
```

### **Constructor Parameters**

1. **Input Validator** - Validates source data before transformation
2. **Output Validator** - Validates target data after transformation  
3. **Forward Transformers** - Array of functions for Source → Target
4. **Reverse Transformers** - Array of functions for Target → Source
5. **Pre-Guards** - Validation before transformation
6. **Post-Guards** - Validation after transformation

## 🎯 **Individual Transformation Functions**

### **Function Signature**
```typescript
type TranslateFunc<TSource, TTarget> = 
    (source: TSource) => Promise<Partial<TTarget>>
```

### **Example Implementations**

**Holo → Claude (Forward):**
```typescript
export const fromToolParametersTranslator: TranslateFunc<HoloTool, ClaudeToolUnion> = 
    async (holoTool: HoloTool): Promise<Partial<ClaudeToolUnion>> => ({
        type: 'custom',  // Set required Claude field
        input_schema: {
            type: 'object',
            ...(holoTool.parameters ?? defaultToolInputSchema)
        }
    });
```

**Claude → Holo (Reverse):**
```typescript
export const toToolParameterTranslator = 
    async (tool: ClaudeToolUnion): Promise<Partial<HoloTool>> => ({
        parameters: (tool as ClaudeTool).input_schema
    });
```

### **Key Patterns**

1. **Async-First** - All functions return `Promise<Partial<T>>`
2. **Partial Results** - Each function contributes part of the target object
3. **Focused Responsibility** - Each function handles one specific transformation
4. **Composable** - Multiple functions combine via array composition

## 🛡️ **Guard System**

Guards provide validation and business logic enforcement:

```typescript
export const customToolOnlyGuard = new Guard<ClaudeToolUnion>(
    "allowOnlyCustomTool",
    (tool) => !(ClaudeToolValidator(tool) instanceof ArkErrors)
);
```

### **Guard Structure**
- **Name** - Identifier for debugging/logging
- **Validation Function** - Returns `true` if valid, `false` if should be rejected
- **Type Parameter** - Specifies what type the guard validates

## 🔗 **Chain Integration Pattern**

Multiple `FieldTranslator`s are orchestrated together in request/response translators:

```typescript
// Conceptual structure (actual implementation may vary)
export const ClaudeRequestTranslator = new RequestTranslator([
    ClaudeToolTranslator,         // Handle tools[] field
    ClaudeToolChoiceTranslator,   // Handle tool_choice field  
    ClaudeMessageTranslator,      // Handle messages[] field
    ClaudeContentTranslator,      // Handle message content
    // ... other field translators
]);
```

## 🎨 **Design Patterns Used**

### **1. Bidirectional Translation**
- Single `FieldTranslator` handles both directions (Source ↔ Target)
- Separate transformer arrays for each direction
- Symmetric validation on both ends

### **2. Pipeline Composition**
```
Input → [Pre-Guards] → [Transformers] → [Post-Guards] → [Validator] → Output
```

### **3. Partial Object Merging**
- Each transformer returns `Partial<Target>`
- Results are merged using spread syntax
- Allows multiple transformers to contribute different fields

### **4. Type Safety + Runtime Validation**
- **Compile-time**: TypeScript generics ensure type correctness
- **Runtime**: arktype validators catch type mismatches
- **Business Logic**: Guards enforce domain-specific rules

## 💡 **Benefits**

| Benefit | Description |
|---------|-------------|
| **Modularity** | Each field translator is independent and testable |
| **Validation** | Built-in input/output validation with meaningful error messages |
| **Extensibility** | Easy to add new transformations or guards without changing existing code |
| **Consistency** | Uniform interface across all translators |
| **Error Handling** | Guards and validators provide multiple layers of error catching |
| **Type Safety** | Full TypeScript support with runtime validation |
| **Composability** | Complex translations built from simple, focused functions |

## 📝 **Implementation Guidelines**

### **When Creating New Translators**

1. **Define clear interfaces** - Use specific types, not `any`
2. **Single responsibility** - Each `TranslateFunc` should handle one transformation
3. **Async by default** - Even simple transformations should return `Promise<Partial<T>>`
4. **Validate inputs/outputs** - Always use arktype validators
5. **Use guards for business logic** - Don't mix validation with transformation
6. **Provide defaults** - Handle missing/undefined values gracefully

### **Example Template**

```typescript
// Individual transformer
export const fromHoloFieldTranslator: TranslateFunc<HoloType, ProviderType> = 
    async (holo: HoloType): Promise<Partial<ProviderType>> => ({
        providerField: transformValue(holo.holoField)
    });

// Reverse transformer  
export const toHoloFieldTranslator: TranslateFunc<ProviderType, HoloType> = 
    async (provider: ProviderType): Promise<Partial<HoloType>> => ({
        holoField: reverseTransformValue(provider.providerField)
    });

// Field translator
export const ProviderFieldTranslator = new FieldTranslator<HoloType, ProviderType>(
    HoloTypeValidator,
    ProviderTypeValidator,
    [fromHoloFieldTranslator],
    [toHoloFieldTranslator],
    [], // pre-guards
    []  // post-guards
);
```

## 🔍 **Debugging and Testing**

### **Testing Individual Transformers**
```typescript
test('fromHoloFieldTranslator', async () => {
    const result = await fromHoloFieldTranslator(mockHoloInput);
    expect(result).toEqual(expectedPartialOutput);
});
```

### **Testing Full Translator**
```typescript
test('ProviderFieldTranslator forward', async () => {
    const result = await ProviderFieldTranslator.translateForward(mockHoloInput);
    expect(result).toEqual(expectedProviderOutput);
});
```

### **Guard Testing**
```typescript
test('customGuard validation', () => {
    expect(customGuard.validate(validInput)).toBe(true);
    expect(customGuard.validate(invalidInput)).toBe(false);
});
```

This architecture provides a robust, extensible foundation for all provider translations while maintaining type safety and clear separation of concerns.
