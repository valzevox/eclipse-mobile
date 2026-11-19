### Highlights & What's New

- **Enterprise-Grade Auto-Updater**:
  - Direct static CDN manifest resolution (`latest.json`) bypassing GitHub API 60 req/h rate limits.
  - Resume-on-reconnect background downloads with battery-aware 3-hour check throttling.
  - Native APK verification gate via `PackageManager.getPackageArchiveInfo`:
    - Strict dynamic package name matching with `context.getPackageName()`.
    - Strict `versionCode` upgrade verification preventing downgrade or infinite re-install loops.
    - Public key certificate fingerprint verification against installed APK via `SigningInfo` / `GET_SIGNING_CERTIFICATES`.
- **Zero-Disruption Audio Playback**:
  - Playback uninterrupted while downloading and prompting system installation intent.
  - Synchronous native storage via `SharedPreferences.Editor.commit()` directly to flash before package replacement.
  - Seamless resumption of queue and playback position on relaunch.
- **Security & Integrity**:
  - Revocation gate with 2-way `blocked` array parsing and dead-end `no-safe-target` protection.
  - Secure APK installation dispatch via Android `FileProvider` + `ACTION_VIEW`.

---

### Artifact Checksums (SHA-512 Base64)

- **Eclipse-v1.0.49.apk**:
  `65NevRav72VC0h/tXjmfJdIKIIfAYW1JL75vKdmK0pndUu+MdaT31eUeFK1ej93+qB39H/5X5X8V4W4vyaUZQg==`
