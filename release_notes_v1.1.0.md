# Eclipse Mobile v1.1.0 Release Notes

## Summary
Eclipse Mobile version 1.1.0 delivers enterprise-grade **Egress Guard Fail-Closed** offline network security isolation, full integration of **Dynamic Studio Palettes** (introducing the 6th preset *Vice Sunset* with real-time swatch picker), and official `NEW` feature discovery badges.

---

## What's New

### 🔒 Enterprise Egress Guard (Fail-Closed Architecture)
- **Zero-Trust Network Isolation**: Complete interception of `globalThis.fetch`, `http.get`, `http.request`, `https.get`, and `https.request` across the mobile proxy test suite.
- **Strict Destination Resolution**: Requests with invalid targets, missing hostnames, malformed protocols, or unverified connection options immediately trigger `EGRESS_BLOCKED`.
- **Bypass Prevention**: Closed all custom DNS `lookup` redirection attack surfaces (including loopback hosts) and Undici/Node.js custom transport/dispatcher escape vectors.
- **Deterministic Offline Fixtures**: Isolated NetEase and Musixmatch lyrics providers using deterministic loopback mock responses.

### 🎨 Dynamic Studio Palettes & Vice Sunset Preset (NEW)
- **Vice Sunset Preset (#ff4fa3)**: Added the vibrant neon synthwave palette to the mobile theme engine.
- **Interactive Swatch Selector**: Embedded one-tap palette switcher inside Theme Settings with live primary and glow token updates.
- **Design Token Parity**: 100% synchronized color definitions and glassmorphic styling with Eclipse PC.

### 📱 Android Platform & Stability
- **Version Code 10100 Alignment**: Clean semantic versioning in Gradle preventing downgrade rejections.
- **Resource Protection**: Validated APK signing and secure FileProvider update handling.
