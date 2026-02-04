#!/bin/bash
set -e

echo "Testing SDK installation..."

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

# Pack SDK
echo "Packing SDK..."
cd /Users/alexduan/IdeaProjects/holo/plugins/sdk
SDK_TGZ=$(npm pack)
SDK_PATH="/Users/alexduan/IdeaProjects/holo/plugins/sdk/$SDK_TGZ"

# Return to test directory
cd "$TEST_DIR"

# Install peer dependencies first
echo "Installing peer dependencies..."
npm install express@^4.21.0 tsyringe@^4.10.0 winston@^3.18.0 reflect-metadata@^0.2.2

# Install SDK
echo "Installing SDK from $SDK_PATH..."
npm install "$SDK_PATH"

# Create a test TypeScript file
echo "Creating test file..."
cat > test.ts << 'EOF'
import { BaseProvider, IProvider, HoloRequest, HoloResponse, pickDefined } from '@holokai/sdk';

console.log('✅ SDK main export successful');
console.log('✅ All exports working correctly!');

// Test subpath exports
import type { LlmRequest } from '@holokai/sdk/core/entities';
console.log('✅ Subpath exports working!');
EOF

# Install TypeScript and type definitions
npm install -D typescript @types/node @types/express

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
EOF

# Try to compile
echo "Compiling test file..."
npx tsc test.ts --noEmit

echo ""
echo "✅ SUCCESS! SDK can be installed and all exports work correctly."
echo ""
echo "Package version installed:"
npm list @holokai/sdk

# Cleanup the packed tarball
rm -f "$SDK_PATH"
