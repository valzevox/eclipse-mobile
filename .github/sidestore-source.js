// Writes sidestore.json (AltStore/SideStore source format) next to Eclipse.ipa in CI.
const fs = require('fs');

const { RUN, REPO, SHA, TAG } = process.env;
const tag = TAG || `v${require('../package.json').version}`;
const version = require('../package.json').version;
const ipa = `https://github.com/${REPO}/releases/download/${tag}/Eclipse-${tag}.ipa`;
const icon = `https://raw.githubusercontent.com/${REPO}/${SHA}/assets/icon-ios.png`;
const now = new Date().toISOString();
const ipaFile = fs.existsSync(`build-artifacts/Eclipse-${tag}.ipa`) ? `build-artifacts/Eclipse-${tag}.ipa` : (fs.existsSync('Eclipse.ipa') ? 'Eclipse.ipa' : null);
const size = ipaFile && fs.existsSync(ipaFile) ? fs.statSync(ipaFile).size : 0;

const app = {
  name: 'Eclipse',
  bundleIdentifier: 'com.valzevox.eclipsemobile',
  developerName: 'valzevox',
  subtitle: 'Free music player',
  iconURL: icon,
  tintColor: '7C4DFF',
  localizedDescription: 'Free, ad-free music player. Stream from YouTube, YouTube Music and SoundCloud, synced lyrics, offline songs, playlists and recommendations. Independent and non-commercial.',
  screenshotURLs: [],
  versions: [{ version, buildVersion: String(RUN || '1'), date: now, size, downloadURL: ipa, minOSVersion: '15.0' }],
  version, versionDate: now, size, downloadURL: ipa,
  appPermissions: {},
};

fs.writeFileSync('build-artifacts/sidestore.json', JSON.stringify({
  name: 'Eclipse',
  identifier: 'com.valzevox.eclipsemobile.source',
  iconURL: icon,
  website: `https://${REPO.split('/')[0]}.github.io/${REPO.split('/')[1]}/`,
  tintColor: '7C4DFF',
  apps: [app],
  news: [],
}, null, 2));
console.log(`sidestore.json: Eclipse ${version}, ${size} bytes`);
