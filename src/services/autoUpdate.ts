// TypeScript / src/services/autoUpdate.ts / Expo React Native / In-App Auto Update Checker, Downloader & Installer

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const GITHUB_REPO = 'valzevox/eclipse-mobile';
const LAST_DISMISSED_KEY = '@eclipse_dismissed_update_version';
const LAST_SHOWN_NOTES_KEY = '@eclipse_last_shown_changelog_version';

export interface UpdateInfo {
  version: string; // e.g. "1.0.1"
  tagName: string; // e.g. "v1.0.1"
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: string;
  hasUpdate: boolean;
}

/**
 * Lấy version hiện tại từ Expo Constants hoặc fallback 1.0.0
 */
export function getCurrentAppVersion(): string {
  const expoVer = Constants.expoConfig?.version;
  return expoVer || '1.0.0';
}

/**
 * Chuẩn hóa chuỗi version: "v1.0.1" -> [1, 0, 1]
 */
function parseVersion(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .trim()
    .split('.')
    .map((num) => parseInt(num, 10) || 0);
}

/**
 * So sánh semantic version: trả về true nếu remote > current
 */
export function isNewerVersion(remoteVer: string, currentVer: string): boolean {
  const r = parseVersion(remoteVer);
  const c = parseVersion(currentVer);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i++) {
    const rPart = r[i] || 0;
    const cPart = c[i] || 0;
    if (rPart > cPart) return true;
    if (rPart < cPart) return false;
  }
  return false;
}

/**
 * Kiểm tra bản cập nhật mới nhất từ GitHub Releases API
 */
export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Eclipse-Mobile-App'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.tag_name) return null;

    const currentVer = getCurrentAppVersion();
    const remoteTag = data.tag_name;
    const remoteVer = remoteTag.replace(/^v/i, '');
    const hasUpdate = isNewerVersion(remoteVer, currentVer);

    // Ưu tiên file Eclipse.apk hoặc file *.apk bất kỳ
    let downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${remoteTag}/Eclipse.apk`;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const eclipseApk = data.assets.find((a: any) => a.name === 'Eclipse.apk');
      const anyApk = data.assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));
      if (eclipseApk && eclipseApk.browser_download_url) {
        downloadUrl = eclipseApk.browser_download_url;
      } else if (anyApk && anyApk.browser_download_url) {
        downloadUrl = anyApk.browser_download_url;
      }
    }

    return {
      version: remoteVer,
      tagName: remoteTag,
      releaseNotes: data.body || '',
      downloadUrl,
      publishedAt: data.published_at || '',
      hasUpdate
    };
  } catch (_) {
    return null;
  }
}

/**
 * Kiểm tra xem người dùng vừa mới update lên bản mới và cần xem changelog không
 */
export async function checkJustUpdatedChangelog(): Promise<string | null> {
  try {
    const currentVer = getCurrentAppVersion();
    const lastShownVer = await AsyncStorage.getItem(LAST_SHOWN_NOTES_KEY);

    // Nếu chưa từng lưu hoặc currentVer khác lastShownVer, lấy release note của version hiện tại
    if (lastShownVer && isNewerVersion(currentVer, lastShownVer)) {
      await AsyncStorage.setItem(LAST_SHOWN_NOTES_KEY, currentVer);
      // Fetch changelog của release hiện tại
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${currentVer}`);
      if (res.ok) {
        const data = await res.json();
        return data.body || `Welcome to Eclipse v${currentVer}!`;
      }
      return `Welcome to Eclipse v${currentVer}! Enjoy new features & performance upgrades.`;
    }

    if (!lastShownVer) {
      await AsyncStorage.setItem(LAST_SHOWN_NOTES_KEY, currentVer);
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Tải file APK mới về máy với progress callback và mở trình cài đặt package installer
 */
export async function downloadAndInstallApk(
  downloadUrl: string,
  onProgress: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS !== 'android') {
      await Linking.openURL(downloadUrl);
      return { success: true };
    }

    const apkUri = `${FileSystem.cacheDirectory}Eclipse-Update.apk`;

    // Xóa file tạm cũ nếu có
    const info = await FileSystem.getInfoAsync(apkUri);
    if (info.exists) {
      await FileSystem.deleteAsync(apkUri, { idempotent: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      apkUri,
      {},
      (downloadProgress) => {
        const total = downloadProgress.totalBytesExpectedToWrite;
        const written = downloadProgress.totalBytesWritten;
        if (total > 0) {
          const pct = Math.min(100, Math.round((written / total) * 100));
          onProgress(pct);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      // Fallback mở link trực tiếp nếu tải ngầm gặp sự cố
      await Linking.openURL(downloadUrl);
      return { success: true };
    }

    onProgress(100);

    // Mở Android Package Installer thông qua Content URI hoặc Intent
    if (FileSystem.getContentUriAsync) {
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await Linking.openURL(contentUri);
    } else {
      await Linking.openURL(result.uri);
    }

    return { success: true };
  } catch (err: any) {
    // Luôn có fallback: mở browser download trực tiếp
    try {
      await Linking.openURL(downloadUrl);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: err?.message || 'Download failed' };
    }
  }
}

export async function dismissUpdateNotice(version: string) {
  try {
    await AsyncStorage.setItem(LAST_DISMISSED_KEY, version);
  } catch (_) {}
}
