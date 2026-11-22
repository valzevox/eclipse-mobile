#!/usr/bin/env node
// scripts/run-tests.mjs
// Test runner orchestrator for Eclipse Mobile: unit (deterministic/offline) and integration (network/service)
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const mode = process.argv[2] || 'unit';
const allTestFiles = readdirSync('test').filter((f) => f.endsWith('.test.js')).sort();

// All 45 test files are fully mocked and deterministic (fake internet/process mocks):
const INTEGRATION_TEST_FILES = new Set([
  // Reserved for future tests requiring unmocked live external network connections
]);

let targetFiles = [];
if (mode === 'unit') {
  targetFiles = allTestFiles.filter((f) => !INTEGRATION_TEST_FILES.has(f));
} else if (mode === 'integration') {
  targetFiles = allTestFiles.filter((f) => INTEGRATION_TEST_FILES.has(f));
} else if (mode === 'all') {
  targetFiles = allTestFiles;
} else {
  console.error(`Unknown test mode: "${mode}". Valid modes: unit, integration, all`);
  process.exit(1);
}

console.log(`[test-runner] Mode: ${mode} | Running ${targetFiles.length} of ${allTestFiles.length} test files...`);
const paths = targetFiles.map((f) => join('test', f));
const res = spawnSync(process.execPath, ['--test', ...paths], { stdio: 'inherit' });
process.exit(res.status ?? 1);
