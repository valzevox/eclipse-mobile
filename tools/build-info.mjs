// Stamps a build with what the update notifier compares against: the commit, run number and time.
// Usage (CI): node tools/build-info.mjs <out file> [channel]
import { readFileSync, writeFileSync } from 'node:fs';

const pkgVersion = () => { try { return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version; } catch (e) { return '1.0.8'; } };

export function buildInfo(channel = '') {
  return {
    sha: process.env.GITHUB_SHA || 'release',
    version: pkgVersion(),
    run: Number(process.env.GITHUB_RUN_NUMBER) || 1,
    repo: process.env.GITHUB_REPOSITORY || 'valzevox/eclipse-mobile',
    builtAt: new Date().toISOString(),
    channel,
  };
}

export const buildInfoScript = (channel) => `window.ECLIPSE_BUILD = window.ECLIPSE_BUILD = ${JSON.stringify(buildInfo(channel))};\n`;

if (process.argv[1] && process.argv[1].endsWith('build-info.mjs')) {
  const [out = 'build-info.js', channel = ''] = process.argv.slice(2);
  writeFileSync(out, buildInfoScript(channel));
  console.log(`${out}: ${buildInfoScript(channel).trim()}`);
}
