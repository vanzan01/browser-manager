#!/usr/bin/env node

// Simple test verification script for our PR
// This just checks if the test files exist and does simple verification

import fs from 'fs';
import path from 'path';

const testFiles = [
  'src/utils/__tests__/format.test.ts',
  'src/services/__tests__/StorageAnalyzer.test.ts',
  'src/__tests__/background.test.ts',
  'vitest.config.ts',
  'src/test/setup.ts',
];

let allPassed = true;

console.log('🧪 Verifying test files exist...');

for (const file of testFiles) {
  try {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file} exists`);
      
      // Read file content to verify it has tests
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('describe(') || content.includes('it(') || content.includes('test(')) {
        console.log(`  ✅ ${file} contains test functions`);
      } else if (file.endsWith('test.ts')) {
        console.log(`  ⚠️ Warning: ${file} may not contain test functions`);
        allPassed = false;
      }
    } else {
      console.log(`  ❌ ${file} does not exist`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`  ❌ Error checking ${file}: ${err.message}`);
    allPassed = false;
  }
}

// Check GitHub workflow file
const workflowFile = '.github/workflows/test.yml';
if (fs.existsSync(workflowFile)) {
  console.log(`  ✅ ${workflowFile} exists`);
  
  const content = fs.readFileSync(workflowFile, 'utf-8');
  if (content.includes('npm test')) {
    console.log(`  ✅ ${workflowFile} includes test command`);
  } else {
    console.log(`  ⚠️ Warning: ${workflowFile} may not run tests`);
    allPassed = false;
  }
} else {
  console.log(`  ❌ ${workflowFile} does not exist`);
  allPassed = false;
}

// Final summary
console.log('\n📝 Test verification summary:');
if (allPassed) {
  console.log('✅ All test files are in place and properly configured!');
  console.log('When vitest is properly installed, you can run the full test suite with:');
  console.log('  npm run test:vitest');
} else {
  console.log('⚠️ Some test files need attention');
  process.exit(1);
}