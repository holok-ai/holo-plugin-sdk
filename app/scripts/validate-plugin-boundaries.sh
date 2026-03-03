#!/bin/bash
# Validate that plugins don't import from main ./src directory
# This prevents TypeScript from compiling main src when building plugins

set -e

echo "🔍 Validating plugin boundaries..."
echo ""

PLUGINS_DIR="plugins"
EXIT_CODE=0

# Check for imports that escape to main src (3+ parent directory levels)
echo "Checking for imports escaping to main ./src..."
ESCAPE_IMPORTS=$(find "$PLUGINS_DIR" -name "*.ts" -type f ! -path "*/node_modules/*" ! -path "*/dist/*" -exec grep -l "from ['\"].*\.\./\.\./\.\./src" {} \; 2>/dev/null || true)

if [ -n "$ESCAPE_IMPORTS" ]; then
    echo "❌ ERROR: Found plugins importing from main ./src directory:"
    echo "$ESCAPE_IMPORTS"
    echo ""
    echo "These imports will cause TypeScript to compile main src/ into the plugin:"
    find "$PLUGINS_DIR" -name "*.ts" -type f ! -path "*/node_modules/*" ! -path "*/dist/*" -exec grep -H "from ['\"].*\.\./\.\./\.\./src" {} \; 2>/dev/null
    EXIT_CODE=1
else
    echo "✅ No imports escaping to main ./src"
fi

echo ""

# Check for compiled files in plugin src directories (should only be in dist/)
echo "Checking for compiled files in plugin src directories..."
COMPILED_IN_SRC=$(find "$PLUGINS_DIR/*/src" -type f \( -name "*.js" -o -name "*.d.ts" -o -name "*.js.map" -o -name "*.d.ts.map" \) 2>/dev/null || true)

if [ -n "$COMPILED_IN_SRC" ]; then
    echo "⚠️  WARNING: Found compiled files in plugin src/ directories:"
    echo "$COMPILED_IN_SRC"
    echo ""
    echo "These should only exist in dist/ directories. Run: npm run clean:workspaces"
    # Not a hard failure, just a warning
else
    echo "✅ No compiled files in plugin src directories"
fi

echo ""

# Check for compiled files in main src directory
echo "Checking for compiled files in main src directory..."
COMPILED_IN_MAIN_SRC=$(find "src" -type f \( -name "*.js" -o -name "*.d.ts" -o -name "*.js.map" -o -name "*.d.ts.map" \) 2>/dev/null || true)

if [ -n "$COMPILED_IN_MAIN_SRC" ]; then
    echo "⚠️  WARNING: Found compiled files in main src/ directory:"
    echo "$COMPILED_IN_MAIN_SRC" | head -10
    echo ""
    echo "These should only exist in dist/ directory. This may indicate a build issue."
    # Not a hard failure, just a warning
else
    echo "✅ No compiled files in main src directory"
fi

echo ""
echo "=========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Plugin boundary validation passed!"
else
    echo "❌ Plugin boundary validation failed!"
    echo ""
    echo "To fix:"
    echo "1. Remove imports that reference ../../../src"
    echo "2. Import from @holokai/sdk instead"
    echo "3. Or copy necessary utilities into the plugin"
fi

exit $EXIT_CODE
