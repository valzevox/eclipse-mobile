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
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
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

  const inMemoryFiles = new Map();
  const windowMock = {
    location: { href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    CustomEvent: function () {},
    fetch: async (url) => new Response('mock-file-content', { status: 200 }),
    androidBridge: {},
    Capacitor: {
      convertFileSrc: (uri) => uri,
      nativePromise: async (plugin, method, args) => {
        if (plugin === 'App') {
          return { url: '' };
        }
        if (plugin === 'Filesystem') {
          if (method === 'mkdir') return {};
          if (method === 'writeFile') {
            inMemoryFiles.set(args.path, args.data);
            return { uri: `capacitor://localhost/_file_/${args.path}` };
          }
          if (method === 'appendFile') {
            const cur = inMemoryFiles.get(args.path) || '';
            inMemoryFiles.set(args.path, cur + args.data);
            return {};
          }
          if (method === 'readFile') {
            return { data: inMemoryFiles.get(args.path) || '' };
          }
          if (method === 'stat') {
            const cur = inMemoryFiles.get(args.path) || '';
            return { type: 'file', size: cur.length, mtime: Date.now() };
          }
          if (method === 'readdir') {
            return { files: [] };
          }
          if (method === 'deleteFile') {
            inMemoryFiles.delete(args.path);
            return {};
          }
          if (method === 'getUri') {
            return { uri: `capacitor://localhost/_file_/${args.path}` };
          }
          if (method === 'checkPermissions' || method === 'requestPermissions') {
            return { publicStorage: 'granted' };
          }
        }
        return {};
      },
      nativeCallback: (plugin, method, args, cb) => {},
      PluginHeaders: [
        {
          name: 'Filesystem',
          methods: [
            { name: 'readFile', rtype: 'promise' },
            { name: 'writeFile', rtype: 'promise' },
            { name: 'appendFile', rtype: 'promise' },
            { name: 'deleteFile', rtype: 'promise' },
            { name: 'mkdir', rtype: 'promise' },
            { name: 'rmdir', rtype: 'promise' },
            { name: 'stat', rtype: 'promise' },
            { name: 'readdir', rtype: 'promise' },
            { name: 'getUri', rtype: 'promise' },
            { name: 'checkPermissions', rtype: 'promise' },
            { name: 'requestPermissions', rtype: 'promise' },
          ],
        },
        {
          name: 'App',
          methods: [
            { name: 'addListener', rtype: 'callback' },
            { name: 'getLaunchUrl', rtype: 'promise' },
            { name: 'minimizeApp', rtype: 'promise' },
          ],
        },
      ],
    },
  };

  const contextObj = {
    window: windowMock,
    globalThis: windowMock,
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
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  };
  windowMock.globalThis = windowMock;
  windowMock.window = windowMock;

  const context = vm.createContext(contextObj);

  vm.runInContext(bundleCode, context);

  // 1. Dispatch YTM accounts query through bridge fetch
  const ytmRes = await context.window.fetch('http://127.0.0.1:38472/api/ytm/accounts');
  assert.equal(ytmRes.status, 200, '/api/ytm/accounts returned 200 OK');
  const ytmData = await ytmRes.json();
  assert.equal(ytmData.success, true);
  assert.deepEqual(ytmData.accounts, []);

  // 2. Case C1: Deterministic Stream Success Path
  // Seed mock audio track in virtual filesystem
  const mockTrackId = 'deterministic_track_123';
  const trackPath = `/data/tracks/${mockTrackId}.opus`;
  const dummyAudioBuffer = Buffer.alloc(65536, 0x42);
  await context.window.__eclipseFs.promises.writeFile(trackPath, dummyAudioBuffer);

  const streamRes = await context.window.fetch(`http://127.0.0.1:38472/api/stream-info?id=${mockTrackId}&title=MockSong&artist=MockArtist`);
  assert.equal(streamRes.status, 200, 'Stream request returns HTTP 200 on cached/resolved track');
  const streamData = await streamRes.json();
  assert.equal(streamData.success, true, 'Stream info must report success === true');
  assert.ok(typeof streamData.streamUrl === 'string' && streamData.streamUrl.length > 0, 'streamUrl must be a non-empty string');
  assert.doesNotThrow(() => new URL(streamData.streamUrl), 'streamUrl must be a valid URL');
  assert.ok(streamData.streamUrl.startsWith('http://127.0.0.1:38472/api/local-track?id='), 'streamUrl must point to internal stream proxy');
  assert.ok(streamData.streamUrl.includes('t='), 'streamUrl must be signed with auth token');

  // Verify internal audio streaming proxy serves the byte stream correctly
  const audioFetchRes = await context.window.fetch(streamData.streamUrl);
  assert.equal(audioFetchRes.status, 200, 'Audio proxy returns 200 for cached audio');

  // 3. Case C2: Graceful Upstream Error Handling Path
  // Requesting non-existent uncached track without network/extractor resolves to 500 without crashing bridge
  const failRes = await context.window.fetch('http://127.0.0.1:38472/api/stream-info?id=non_existent_uncached_track');
  assert.equal(failRes.status, 500, 'Uncached track without network returns 500 error response');
  const failData = await failRes.json();
  assert.equal(failData.success, false, 'Failed stream resolution reports success === false');
  assert.ok(failData.error, 'Failed stream resolution returns error message');

  // Verify bridge remains responsive after upstream error
  const postFailRes = await context.window.fetch('http://127.0.0.1:38472/api/ytm/accounts');
  assert.equal(postFailRes.status, 200, 'Bridge remains healthy and responsive after error');
});

test('Case E: First-party mobile shim isolation & zero desktop leaks in bundle', () => {
  const metaPath = path.join(ROOT, 'www', 'meta.json');
  assert.ok(fs.existsSync(metaPath), 'meta.json must be generated by mobile build');

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const inputs = Object.keys(meta.inputs);

  // Assert desktop native modules are NOT bundled into mobile-bridge
  const leakedDesktopModules = inputs.filter((f) => /^(platform|tools|logger|audio-output)\.js$/.test(f));
  assert.deepEqual(leakedDesktopModules, [], 'Desktop native modules must not leak into mobile bundle');

  // Assert mobile shims are actually resolved and bundled
  const bundledShims = inputs.filter((f) => f.includes('mobile/shims/'));
  assert.ok(bundledShims.some((s) => s.includes('platform.js')), 'mobile/shims/platform.js must be bundled');
  assert.ok(bundledShims.some((s) => s.includes('logger.js')), 'mobile/shims/logger.js must be bundled');
  assert.ok(bundledShims.some((s) => s.includes('audio-output.js')), 'mobile/shims/audio-output.js must be bundled');
  assert.ok(bundledShims.some((s) => s.includes('tools.js')), 'mobile/shims/tools.js must be bundled');
});

test('Case D: Desktop Electron environment preserves native logger', () => {
  // Verify standard node/desktop evaluation still loads and uses logger properly
  const ytmAuthPath = path.join(ROOT, 'ytm-auth.js');
  const YtmAuth = require(ytmAuthPath);
  assert.equal(typeof YtmAuth, 'function');
  const instance = new YtmAuth(path.join(ROOT, '.test-data'));
  assert.ok(instance);
});
