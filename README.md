# Eclipse

Eclipse is a music player for Android, iOS, and Desktop — built with the full PC desktop architecture, Material 3 dynamic themes, real-time synced karaoke lyrics, WebAudio FX, and zero-latency InnerTube / SoundCloud streaming.

## Features

- **Full Desktop Parity on Mobile** — Identical layout, Material 3 dynamic palettes, 19 rotating badge shapes, and smooth Now Playing / Queue / Lyrics sheets.
- **Eclipse Brand Intro Animation** — Glassmorphic coronal ring & rotating 19-lobe scalloped badge intro on launch.
- **In-App Auto Update & Markdown Changelog** — Automatically detects new GitHub releases (`valzevox/eclipse-mobile`), renders full Markdown release notes, and downloads the latest `Eclipse-vX.Y.Z.apk`.
- **Zero-Wait Audio Extraction** — VisionOS Audio-only HLS (`itag 234/233`) & Opus 251 pipeline bypassing googlevideo 403 blocks, plus SoundCloud & multi-platform playlist import (YouTube, YT Music, Spotify, Apple Music, Yandex).
- **Lyrics & Audio Engine** — Word-by-word synced karaoke lyrics (LRCLIB, NetEase, KuGou, Musixmatch), romaji/translation, EQ, reverb, pitch/speed presets, and waveform track trimming.

## Development

```bash
npm install
node mobile/build.mjs
npx cap sync android
```

## License

MIT. See [LICENSE](LICENSE).
