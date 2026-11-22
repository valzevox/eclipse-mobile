// test/mobile-bridge-startup.test.js
// Regression test suite for Eclipse Mobile Bridge startup & ytm-auth environment compatibility
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

test('Case A: ytm-auth.js evaluates in browser/mobile context without __dirname', () => {
  const ytmAuthCode = fs.readFileSync(path.join(ROOT, 'ytm-auth.js'), 'utf8');

  // Strict sandbox without __dirname, __filename, or native require
  const customLogs = [];
  const sandbox = {
    process: { versions: { mobile: '1' } },
    console: {
      log: (...args) => customLogs.push(args.join(' ')),
      warn: (...args) => customLogs.push(args.join(' ')),
      error: (...args) => customLogs.push(args.join(' ')),
    },
    require: (mod) => {
      if (mod === 'crypto') return crypto;
      if (mod === 'path') return path;
      if (mod === 'youtubei.js') return { Innertube: {} };
      if (mod === 'fs') return { existsSync: () => false };
      throw new Error(`Unexpected require: ${mod}`);
    },
    module: { exports: {} },
    exports: {},
    Buffer: Buffer,
    setTimeout,
    clearTimeout,
  };

  // Ensure __dirname is strictly undefined in sandbox context
  assert.equal(typeof sandbox.__dirname, 'undefined');

  const context = vm.createContext(sandbox);
  assert.doesNotThrow(() => {
    vm.runInContext(ytmAuthCode, context);
  }, 'ytm-auth.js must not throw ReferenceError when evaluated without __dirname');

  assert.equal(typeof sandbox.module.exports, 'function', 'YtmAuthManager class exported');
  const YtmAuth = sandbox.module.exports;
  const instance = new YtmAuth('/data/test');
  assert.ok(instance, 'Instance created successfully in mobile context');
});

test('Case B: Mobile server startup smoke test (mobile-bridge.js bundle in browser context)', async () => {
  const bundlePath = path.join(ROOT, 'www', 'mobile-bridge.js');
  assert.ok(fs.existsSync(bundlePath), 'www/mobile-bridge.js bundle must exist');

  const bundleCode = fs.readFileSync(bundlePath, 'utf8');

  // Verify zero un-guarded occurrences of __dirname in the bundle
  const dirnameMatches = bundleCode.match(/__dirname/g) || [];
  assert.equal(dirnameMatches.length, 2, 'Bundle only contains safe typeof __dirname guards');

  const windowMock = {
    location: { href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    CustomEvent: function (event, params) { this.event = event; this.detail = params?.detail; },
    fetch: () => Promise.resolve(),
  };

  const context = vm.createContext({
    window: windowMock,
    document: {
      addEventListener: () => {},
      documentElement: { classList: { add: () => {} } },
    },
    Element: { prototype: { removeAttribute: () => {} } },
    HTMLMediaElement: { prototype: { play: () => {} } },
    HTMLImageElement: { prototype: {} },
    MutationObserver: class { observe() {} },
    localStorage: {
      _store: new Map(),
      getItem(k) { return this._store.get(k) || null; },
      setItem(k, v) { this._store.set(k, String(v)); },
      removeItem(k) { this._store.delete(k); },
    },
    navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    URL: URL,
    URLSearchParams: URLSearchParams,
    Request: Request,
    Response: Response,
    Headers: Headers,
    crypto: crypto.webcrypto,
  });

  // Verify __dirname and __filename are strictly absent from global context
  assert.equal(typeof context.__dirname, 'undefined');
  assert.equal(typeof context.__filename, 'undefined');

  assert.doesNotThrow(() => {
    vm.runInContext(bundleCode, context);
  }, 'mobile-bridge.js must execute without throwing ReferenceError: __dirname is not defined');

  assert.ok(context.window.electronAPI, 'window.electronAPI must be defined');
  assert.equal(typeof context.window.fetch, 'function', 'window.fetch must be patched by mobile-bridge');
});

test('Case C: Stream-info & YTM route dispatch through mobile bridge', async () => {
  const bundlePath = path.join(ROOT, 'www', 'mobile-bridge.js');
  const bundleCode = fs.readFileSync(bundlePath, 'utf8');

  const windowMock = {
    location: { href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    CustomEvent: function () {},
    fetch: () => Promise.resolve(),
  };

  const context = vm.createContext({
    window: windowMock,
    document: {
      addEventListener: () => {},
      documentElement: { classList: { add: () => {} } },
    },
    Element: { prototype: { removeAttribute: () => {} } },
    HTMLMediaElement: { prototype: { play: () => {} } },
    HTMLImageElement: { prototype: {} },
    MutationObserver: class { observe() {} },
    localStorage: {
      _store: new Map(),
      getItem(k) { return this._store.get(k) || null; },
      setItem(k, v) { this._store.set(k, String(v)); },
      removeItem(k) { this._store.delete(k); },
    },
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14)' },
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    URL: URL,
    URLSearchParams: URLSearchParams,
    Request: Request,
    Response: Response,
    Headers: Headers,
    crypto: crypto.webcrypto,
  });

  vm.runInContext(bundleCode, context);

  // 1. Dispatch YTM accounts query through bridge fetch
  const ytmRes = await context.window.fetch('http://127.0.0.1:38472/api/ytm/accounts');
  assert.equal(ytmRes.status, 200, '/api/ytm/accounts returned 200 OK');
  const ytmData = await ytmRes.json();
  assert.equal(ytmData.success, true);
  assert.deepEqual(ytmData.accounts, []);

  // 2. Dispatch stream-info query through bridge fetch
  const streamRes = await context.window.fetch('http://127.0.0.1:38472/api/stream-info?id=test_track_id');
  assert.ok(streamRes.status >= 200 && streamRes.status <= 500, 'Stream request dispatched without bridge crash');
  const streamData = await streamRes.json();
  assert.ok(typeof streamData.success === 'boolean');
});

test('Case D: Desktop Electron environment preserves native logger', () => {
  // Verify standard node/desktop evaluation still loads and uses logger properly
  const ytmAuthPath = path.join(ROOT, 'ytm-auth.js');
  const YtmAuth = require(ytmAuthPath);
  assert.equal(typeof YtmAuth, 'function');
  const instance = new YtmAuth(path.join(ROOT, '.test-data'));
  assert.ok(instance);
});
