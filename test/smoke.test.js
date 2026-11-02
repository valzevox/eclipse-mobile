// JavaScript / test/smoke.test.js / Node.js Test Runner / Automated Unit & Parity Verification Suite (Ported from Riff-Muriel test/)

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// 1. Verify project structure parity with Riff-Muriel
const requiredPaths = [
  'LICENSE',
  'README.md',
  'app.json',
  'package.json',
  '.github/workflows/release.yml',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yaml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'docs/index.html',
  'docs/privacy.html',
  'docs/terms.html',
  'assets/icon.png',
  'assets/eclipse.svg',
  'assets/01-default.svg',
  'assets/19-horizon.svg',
  'src/services/libraryTools.ts',
  'src/services/autoUpdate.ts',
  'src/plugins/betterShuffle.ts'
];

for (const rel of requiredPaths) {
  const full = path.join(ROOT, rel);
  assert.ok(fs.existsSync(full), `Missing required file: ${rel}`);
}

// 2. Verify app.json naming & icon rules
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
assert.equal(appJson.expo.name, 'Eclipse', 'App display name must strictly be Eclipse');
assert.equal(appJson.expo.icon, './assets/icon.png', 'App icon must be configured');

// 3. Verify release.yml outputs single versioned APK
const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/release.yml'), 'utf8');
assert.ok(workflow.includes('Eclipse-${TAG_VER}.apk'), 'Workflow must output Eclipse-${TAG_VER}.apk');
assert.ok(!workflow.includes('build-artifacts/Eclipse.apk"'), 'Workflow must not output duplicate unversioned APK');

console.log('ALL SMOKE & PARITY CHECKS PASSED (0 errors)');
