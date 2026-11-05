<p align="center">
  <img src="banner.png?v=2" alt="Eclipse Mobile - open-source music player for Android and iOS" width="100%">
</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg" width="22" height="22" alt="Android">&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/ios/9ca3af" width="22" height="22" alt="iOS">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows8/windows8-original.svg" width="22" height="22" alt="Windows">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg" width="22" height="22" alt="macOS">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg" width="22" height="22" alt="Linux">
</p>

<h1 align="center">
  <img src="assets/eclipse.svg" width="48" height="48" align="absmiddle" alt="Eclipse Logo">&nbsp;Eclipse Mobile
</h1>

<p align="center">
  <b>A free, open-source mobile music player & audio suite for Android and iOS.</b><br>
  Built with full Eclipse PC parity, Material Design 3, real-time synced karaoke lyrics, and zero tracking.
</p>

<p align="center">
  <a href="https://github.com/valzevox/eclipse-mobile/releases">
    <img src="https://img.shields.io/badge/Download_APK-6750A4?style=for-the-badge&logo=android&logoColor=white" height="40" alt="Download APK">
  </a>
  &nbsp;
  <a href="https://eclipse-player.vercel.app">
    <img src="https://img.shields.io/badge/Website-1F2328?style=for-the-badge&logo=open-webui&logoColor=white" height="40" alt="Visit Website">
  </a>
  &nbsp;
  <a href="https://ko-fi.com/m1n698">
    <img src="https://img.shields.io/badge/Donate-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" height="40" alt="Ko-fi">
  </a>
  &nbsp;
  <a href="https://zypage.com/m1n6">
    <img src="https://img.shields.io/badge/Donate-ZyPage-6366F1?style=for-the-badge&logo=linktree&logoColor=white" height="40" alt="ZyPage">
  </a>
</p>

<p align="center">
  <a href="#what-is-eclipse-mobile">Overview</a> &nbsp;·&nbsp;
  <a href="#core-features">Features</a> &nbsp;·&nbsp;
  <a href="#built-in-audio-suite">Audio Suite</a> &nbsp;·&nbsp;
  <a href="#synchronized-lyrics-engine">Lyrics Engine</a> &nbsp;·&nbsp;
  <a href="#material-design-3-expressive">Interface</a> &nbsp;·&nbsp;
  <a href="#download-and-install">Install</a> &nbsp;·&nbsp;
  <a href="#build-from-source">Build</a> &nbsp;·&nbsp;
  <a href="#faq">FAQ</a>
</p>

<p align="center">
  <a href="https://github.com/valzevox/eclipse-mobile/stargazers"><img src="https://img.shields.io/github/stars/valzevox/eclipse-mobile?style=flat-square&labelColor=16191C&color=CAD3F5" alt="Stars"></a>
  <a href="https://github.com/valzevox/eclipse-mobile/commits/main"><img src="https://img.shields.io/github/last-commit/valzevox/eclipse-mobile?style=flat-square&labelColor=16191C&color=94C9FF" alt="Last Commit"></a>
  <a href="https://github.com/valzevox/eclipse-mobile/blob/main/LICENSE"><img src="https://img.shields.io/github/license/valzevox/eclipse-mobile?style=flat-square&labelColor=16191C&color=8EEDD8" alt="License"></a>
</p>

---

## What is Eclipse Mobile?

**Eclipse Mobile** is an open-source, telemetry-free music player for **Android and iOS**, maintaining architectural parity with **Eclipse PC** (formerly Riff). It unifies streaming across **YouTube Music**, **YouTube**, **SoundCloud**, and local offline audio files into a touch-optimized mobile experience without subscriptions, ads, or account requirements.

Powered by **Capacitor**, **Vanilla JavaScript**, **Tone.js / WebAudio**, and **WebGL**, Eclipse Mobile delivers hardware-accelerated visuals, low-latency audio processing, and responsive gesture-based navigation without heavy runtime framework overhead. Released under the permissive **MIT License**, privacy is absolute: your listening history, cache, and preferences never leave your device.

---

## Core Features

- **Full Desktop Parity on Mobile**: All PC audio features, playlist engines, multi-engine lyrics lookups, and visualizers ported directly to mobile.
- **Zero-Wait Audio Extraction**: VisionOS audio-only HLS (`itag 234/233`) and Opus 251 extraction pipeline bypassing Googlevideo 403 throttles.
- **Unrestricted Streaming**: YouTube Music, YouTube, and SoundCloud streaming without commercial ads or account logins.
- **Offline Lossless Audio**: Native local playback for FLAC, WAV, MP3, OGG, and M4A with high-resolution artwork and ID3 tag extraction.
- **Eclipse Stroke Splash Intro**: Dynamic SVG vector stroke-dasharray drawing animation and cubic-bezier easing matching the PC desktop splash.
- **In-App Auto Updater**: Automated GitHub Releases checker (`valzevox/eclipse-mobile`) with Markdown changelog parsing, non-blocking toast queues, and direct APK download/install.
- **1-Click Playlist Migration**: Import public playlists from Spotify (with automated 100+ track pagination), Apple Music, SoundCloud, and YouTube Music.
- **Background Playback & Lock Screen Controls**: Full MediaSession API integration with media notification, album art display, and lockscreen playback controls.
- **Zero Telemetry**: No analytics tracking, crash reporting pings, or background data exfiltration.

---

## Built-in Audio Suite

Eclipse Mobile packs a professional audio engineering suite directly on your phone:

### Visual Audio Editor
- **Lossless Audio Trimming**: Interactive touch waveform to trim audio boundaries without re-encoding quality loss.
- **Region Extraction**: Isolate ringtones, loops, or audio samples and export directly to local storage.
- **Non-Destructive Processing**: Trimming generates independent clips while preserving original tracks intact.

### 10-Band Parametric Equalizer
- Precision frequency sliders (32 Hz to 16 kHz) with built-in acoustic presets (Bass Boost, Vocal Clarity, Electronic, Flat, Rock).
- Real-time gain control powered by the Web Audio API.

### Real-Time DSP Effects Chain
- **Tempo Control**: Smoothly accelerate or decelerate playback speed without altering vocal pitch.
- **Pitch Shifting**: Independent semitone pitch transpose for tuning and vocal rehearsal.
- **Reverb & Spatial Simulation**: Algorithmic convolution and spatial room simulation.
- **Distortion / Saturation**: Adjustable wave-shaping overdrive harmonics.

---

## Synchronized Lyrics Engine

Never miss a beat with Eclipse's multi-source lyrics pipeline:

- **Multi-Engine Fallback Pipeline**: Cascading queries across **LRCLIB**, **Genius**, **NetEase**, **KuGou**, **Musixmatch**, **YouTube Music**, and **SoundCloud**.
- **Smart Metadata Classifier**: Automatic bidirectional artist/title pair resolution (`p1 - p2` vs `p2 - p1`), noise stripping (`(Official MV)`, `[MV]`, `visualizer`), clean lead artist isolation (`ft.`, `feat.`), and `±18s` duration matching.
- **Word-by-Word Karaoke Synced Lyrics**: Real-time line highlighting and syllable tracking with customizable offset timing.
- **Romaji & Translation**: Automatic phonetic transliteration and multi-language translation directly inside the lyrics sheet.
- **Interactive Fullscreen Mode**: Fluid lyrics presentation with blurred dynamic artwork backgrounds.

---

## Material Design 3 Expressive

- **Dynamic Artwork Palette Extraction**: Real-time extraction of dominant and secondary colors from album artwork to tint navigation bars, cards, and backgrounds.
- **19 Rotating Badge Shapes**: Expressive Material 3 shape morphing for playlist badges and album highlights.
- **Fluid Bottom Sheets & Gestures**: Swipeable Now Playing, Queue, and Lyrics drawers designed for comfortable one-handed navigation.
- **Customization Engine**: Dark/Light/Pure AMOLED black modes, interface opacity adjustments, and custom CSS injection.

---

## Download and Install

Get the latest pre-compiled Android release from the [Releases page](https://github.com/valzevox/eclipse-mobile/releases):

1. Download `Eclipse-vX.Y.Z.apk` to your Android device.
2. Open the downloaded `.apk` file and grant installation permissions if prompted.
3. Launch Eclipse and start listening immediately—no registration required.
4. Future updates are automatically notified inside the app with release changelogs.

---

## Build from Source

Eclipse Mobile requires **Node.js 18+**, **npm**, and **Android Studio / Android SDK** (for APK generation).

```bash
# Clone the repository
git clone https://github.com/valzevox/eclipse-mobile.git
cd eclipse-mobile

# Install dependencies
npm install

# Build web assets and sync Capacitor plugins
node mobile/build.mjs
npx cap sync android

# Run tests
npm test

# Build debug APK via Gradle
cd android
./gradlew assembleDebug
```

The compiled APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## FAQ

**Is Eclipse Mobile free?**  
Yes. Eclipse Mobile is completely free and open-source software under the MIT License. No hidden fees, in-app purchases, or subscription locks.

**Does it require an account or login?**  
No. You do not need any Google, YouTube, or SoundCloud account. All playlist imports and stream resolutions run without authentication.

**Does it display ads?**  
No. Streams from all integrated platforms are resolved cleanly without banner, pop-up, or audio ads.

**Can I listen offline?**  
Yes. Downloaded tracks and local audio files (FLAC, MP3, WAV, etc.) play entirely offline without an active internet connection.

**How does playlist migration work?**  
Simply paste a public playlist link from Spotify, Apple Music, SoundCloud, or YouTube Music. Eclipse parses all tracks and batches metadata lookups to recreate the playlist locally.

---

## Contributing

Pull requests, bug reports, and suggestions are welcome! Feel free to open an issue or pull request.

<a href="https://github.com/valzevox/eclipse-mobile/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=valzevox/eclipse-mobile" alt="Eclipse Mobile Contributors" />
</a>

## Support & Donate

Eclipse Mobile is an independent, ad-free, open-source project. If Eclipse Mobile brings joy to your music listening, consider supporting ongoing development:

<p align="left">
  <a href="https://ko-fi.com/m1n698" target="_blank">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Support on Ko-fi">
  </a>
  &nbsp;
  <a href="https://zypage.com/m1n6" target="_blank">
    <img src="https://img.shields.io/badge/Donate-ZyPage-6366F1?style=for-the-badge&logo=linktree&logoColor=white" alt="m1n6 on ZyPage">
  </a>
</p>

- ☕ **Ko-fi:** [ko-fi.com/m1n698](https://ko-fi.com/m1n698)
- 💳 **ZyPage:** [m1n6 on ZyPage](https://zypage.com/m1n6)

Your support helps maintain dependencies, build infrastructure, and ship regular updates!

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with precision by <a href="https://github.com/valzevox">valzevox</a> and the Eclipse community.</sub>
</p>
