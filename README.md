# Eclipse Music Mobile (iOS & Android)

Modern cross-platform mobile music player built with **React Native & Expo (TypeScript)** for iPhone (iOS) and Android.

## Features

- **Multi-Source Streaming**: Ad-free YouTube Music, YouTube, and SoundCloud playback via pure-TS Innertube & Piped resolvers.
- **AMLL Word-by-Word & Line Synced Lyrics**: Supports LRC and NetEase YRC word-synced karaoke lyrics with offset controls (`-0.2s` / `+0.2s`).
- **Smart CJK Romanization & Translation**: Automatic Romaji / Pinyin / Romaja conversion for non-Latin scripts without duplicating already-romanized lines.
- **Audio FX & Loop Trim**: Real-time Tempo & Pitch controls (`Nightcore`, `Slowed + Reverb`) and custom loop trim points.
- **External Playlist Import**: Paste Spotify or YouTube Music playlist links to import directly into your library.
- **Listening Statistics**: Track minutes listened, tracks played, and top artists.
- **Multilingual UI (i18n)**: Full support for Vietnamese (`vi`), English (`en`), Japanese (`ja`), Korean (`ko`), Chinese (`zh-CN`), and Russian (`ru`).

## Quick Start

```bash
npm install --legacy-peer-deps
npx expo start
```

## License

MIT
