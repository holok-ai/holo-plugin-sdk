#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

console.log('📦 Verifying @holokai/common package...\n');

const errors = [];
const warnings = [];

// 1. Check package.json
console.log('1. Checking package.json...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

if (!packageJson.name) errors.push('Missing package name');
if (!packageJson.version) errors.push('Missing package version');
if (!packageJson.main) errors.push('Missing main entry point');
if (!packageJson.types) errors.push('Missing types entry point');

// 2. Check if dist folder exists
console.log('2. Checking build output...');
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
    errors.push('dist folder does not exist - run npm run build first');
} else {
    const mainFile = path.join(__dirname, '..', packageJson.main);
    const typesFile = path.join(__dirname, '..', packageJson.types);
    if (!fs.existsSync(mainFile)) errors.push(`Main entry point ${packageJson.main} does not exist`);
    if (!fs.existsSync(typesFile)) errors.push(`Types entry point ${packageJson.types} does not exist`);
}

// 3. Check TypeScript declarations
console.log('3. Checking TypeScript declarations...');
const indexDtsPath = path.join(distPath, 'index.d.ts');
if (!fs.existsSync(indexDtsPath)) {
    errors.push('index.d.ts not found in dist folder');
}

// Report results
console.log('\n' + '='.repeat(60));
if (errors.length === 0) {
    console.log('✅ Package verification passed! Ready to publish.');
} else {
    console.log('\n❌ ERRORS (must fix before publishing):');
    errors.forEach(err => console.log(`   - ${err}`));
    console.log('\n❌ Package verification FAILED');
    process.exit(1);
}
console.log('='.repeat(60));
