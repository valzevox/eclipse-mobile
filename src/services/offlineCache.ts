// TypeScript / src/services/offlineCache.ts / Expo React Native / Offline Audio Caching & Local File Picker

import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { TrackItem, resolveStreamUrl } from './innertube';

const CACHE_FOLDER = `${FileSystem.documentDirectory || ''}eclipse_cache/`;

async function ensureCacheDir() {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(CACHE_FOLDER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
  }
}

export async function downloadTrackOffline(track: TrackItem): Promise<TrackItem | null> {
  try {
    await ensureCacheDir();
    const streamUrl = await resolveStreamUrl(track);
    if (!streamUrl) return null;
    const safeId = track.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetUri = `${CACHE_FOLDER}${safeId}.m4a`;
    const res = await FileSystem.downloadAsync(streamUrl, targetUri);
    if (res.status === 200) {
      return {
        ...track,
        localUri: res.uri
      };
    }
  } catch (_) {}
  return null;
}

export async function pickLocalAudioFiles(): Promise<TrackItem[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: true
    });
    if (result.canceled || !result.assets) return [];
    return result.assets.map((asset, i) => {
      const rawName = (asset.name || `Local Track ${i + 1}`).replace(/\.[a-zA-Z0-9]+$/, '');
      const parts = rawName.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Local File';
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : rawName.trim();
      return {
        id: `local_${Date.now()}_${i}`,
        title,
        artist,
        duration: 210,
        thumbnail: 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
        platform: 'local' as const,
        localUri: asset.uri
      };
    });
  } catch (_) {
    return [];
  }
}
