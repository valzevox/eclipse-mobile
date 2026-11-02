// JavaScript / test/smoke.test.js / Node.js Test Runner / Automated Unit & Parity Suite (Ported from Riff-Muriel test/)

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// 1. Structure parity with Riff-Muriel
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
  'src/services/shapes.ts',
  'src/services/autoUpdate.ts',
  'src/plugins/betterShuffle.ts'
];

for (const rel of requiredPaths) {
  const full = path.join(ROOT, rel);
  assert.ok(fs.existsSync(full), `Missing required file: ${rel}`);
}

// 2. App display name & icon rules
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
assert.equal(appJson.expo.name, 'Eclipse');
assert.equal(appJson.expo.icon, './assets/icon.png');

// 3. Release workflow rule: single versioned APK asset
const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/release.yml'), 'utf8');
assert.ok(workflow.includes('Eclipse-${TAG_VER}.apk'));
assert.ok(!workflow.includes('build-artifacts/Eclipse.apk"'));

// 4. Transpile libraryTools.ts via TypeScript compiler to run Riff-Muriel unit test cases
const ts = require('typescript');
const tsCode = fs.readFileSync(path.join(ROOT, 'src/services/libraryTools.ts'), 'utf8');
const transpiled = ts.transpileModule(tsCode, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', transpiled)(mod.exports, mod, () => ({}));
const lib = mod.exports;

// Riff-Muriel search-text.test.js assertions
assert.equal(lib.normalizeSearch('  Hello World  '), 'hello world');
assert.equal(lib.normalizeSearch('Björk'), 'bjork');
assert.equal(lib.normalizeSearch('Đừng Làm Trái Tim Anh Đau'), 'dung lam trai tim anh dau');
assert.equal(lib.normalizeSearch('أحبك'), lib.normalizeSearch('احبك'));
assert.equal(lib.normalizeSearch('كَتَبَ'), lib.normalizeSearch('كتب'));
assert.equal(lib.normalizeSearch('مــوسيقى'), lib.normalizeSearch('موسيقى'));
assert.equal(lib.normalizeSearch('ليلى'), lib.normalizeSearch('ليلي'));
assert.equal(lib.normalizeSearch('أغنية'), lib.normalizeSearch('اغنيه'));
assert.equal(lib.normalizeSearch('کتاب'), lib.normalizeSearch('كتاب'));
assert.equal(lib.normalizeSearch(undefined), '');
assert.equal(lib.normalizeSearch(null), '');
assert.equal(lib.normalizeSearch(42), '');

// Riff-Muriel lyrics-rtl.test.js assertions
assert.equal(lib.isRtlText('أحبك يا حياتي'), true);
assert.equal(lib.isRtlText('אני אוהב אותך'), true);
assert.equal(lib.isRtlText('I love you tonight'), false);
assert.equal(lib.isRtlText('123 - أحبك'), true);
assert.equal(lib.isRtlText('Hello مرحبا'), false);
assert.equal(lib.isRtlText('مرحبا Hello'), true);
assert.equal(lib.isRtlText('<span>مرحبا</span>'), true);
assert.equal(lib.isRtlText(''), false);

// Riff-Muriel library-tools.test.js assertions
const sameById = (a, b) => a.id === b.id;
assert.deepEqual(
  lib.dedupeTracks([{ id: 'b' }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'a' }], sameById).map((t) => t.id),
  ['b', 'a', 'c']
);
assert.deepEqual(lib.dedupeTracks(null, sameById), []);

// Riff-Muriel track-sort.test.js assertions
const trk = (id, addedAt) => (addedAt === undefined ? { id } : { id, addedAt });
assert.deepEqual(lib.sortTracks([trk('b', 3), trk('a', 1), trk('c', 2)], 'manual').map((t) => t.id), ['b', 'a', 'c']);
assert.deepEqual(lib.sortTracks([trk('old', 1), trk('new', 3), trk('mid', 2)], 'added-desc').map((t) => t.id), ['new', 'mid', 'old']);
assert.deepEqual(lib.sortTracks([trk('old', 1), trk('new', 3), trk('mid', 2)], 'added-asc').map((t) => t.id), ['old', 'mid', 'new']);
assert.deepEqual(lib.sortTracks([trk('plain-b'), trk('dated', 5), trk('plain-a')], 'added-desc').map((t) => t.id), ['dated', 'plain-b', 'plain-a']);

const detail = (id, title, artist, duration) => ({ id, title, artist, duration });
assert.deepEqual(
  lib.sortTracks([detail('1', 'beta', 'x', 10), detail('2', 'Alpha', 'x', 10), detail('3', 'gamma', 'x', 10)], 'title-asc').map((t) => t.id),
  ['2', '1', '3']
);
assert.deepEqual(
  lib.sortTracks([detail('1', '', 'x', 10), detail('2', 'alpha', 'x', 10)], 'title-asc').map((t) => t.id),
  ['2', '1']
);
assert.deepEqual(
  lib.sortTracks([detail('1', 'a', 'x', 240), detail('2', 'b', 'x', 0), detail('3', 'c', 'x', 95)], 'duration-asc').map((t) => t.id),
  ['3', '1', '2']
);
assert.deepEqual(lib.TRACK_SORT_MODES.slice(0, 3), ['manual', 'added-desc', 'added-asc']);

console.log('ALL RIFF-MURIEL UNIT & PARITY TESTS PASSED (0 errors)');
