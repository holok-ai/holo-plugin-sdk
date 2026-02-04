#!/bin/bash
set -e

echo "Testing local package installation..."

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "Created test directory: $TEST_DIR"

# Cleanup function
cleanup() {
    echo "Cleaning up test directory..."
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Navigate to test directory
cd "$TEST_DIR"

# Initialize a new npm project
echo "Initializing test project..."
npm init -y

# Pack all packages
echo "Packing SDK..."
cd /Users/alexduan/IdeaProjects/holo/plugins/sdk
SDK_TGZ=$(npm pack)
SDK_PATH="/Users/alexduan/IdeaProjects/holo/plugins/sdk/$SDK_TGZ"

echo "Packing Claude provider..."
cd /Users/alexduan/IdeaProjects/holo/plugins/holo-provider-claude
CLAUDE_TGZ=$(npm pack)
CLAUDE_PATH="/Users/alexduan/IdeaProjects/holo/plugins/holo-provider-claude/$CLAUDE_TGZ"

# Return to test directory
cd "$TEST_DIR"

# Install peer dependencies first
echo "Installing peer dependencies..."
npm install express@^4.21.0 tsyringe@^4.10.0 winston@^3.18.0 reflect-metadata@^0.2.2

# Install SDK
echo "Installing SDK from $SDK_PATH..."
npm install "$SDK_PATH"

# Install Claude provider
echo "Installing Claude provider from $CLAUDE_PATH..."
npm install "$CLAUDE_PATH"

# Create a test TypeScript file
echo "Creating test file..."
cat > test.ts << 'EOF'
import { BaseProvider } from '@holokai/sdk';
import { ClaudeProviderPlugin } from '@holokai/holo-provider-claude';

console.log('✅ SDK import successful');
console.log('✅ Claude provider import successful');
console.log('✅ All packages installed correctly!');
EOF

# Install TypeScript and type definitions
npm install -D typescript @types/node @types/express

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowImportingTsExtensions": false
  }
}
EOF

# Try to compile
echo "Compiling test file..."
npx tsc test.ts --noEmit

echo ""
echo "✅ SUCCESS! All packages can be installed and imported correctly."
echo ""
echo "Package versions installed:"
npm list @holokai/sdk @holokai/holo-provider-claude

# Cleanup the packed tarballs
rm -f "$SDK_PATH" "$CLAUDE_PATH"
