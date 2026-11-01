// TypeScript / src/services/innertube.ts / Expo React Native / YouTube Music & SoundCloud Resolver

import { searchSoundCloud, resolveSoundCloudStream } from './soundcloud';

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail: string;
  platform: 'ytmusic' | 'youtube' | 'soundcloud' | 'local';
  streamUrl?: string;
  localUri?: string;
}

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://api.piped.projectsegfau.lt'
];

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacyredirect.com'
];

export async function searchTracks(
  query: string,
  platform: 'ytmusic' | 'youtube' | 'soundcloud' = 'ytmusic'
): Promise<TrackItem[]> {
  if (!query || !query.trim()) return [];
  if (platform === 'soundcloud') {
    const scResults = await searchSoundCloud(query);
    if (scResults.length > 0) return scResults;
  }
  const q = encodeURIComponent(query.trim());

  // 1. Try Piped API (fast, no API key, supports music_songs filter)
  const filter = platform === 'ytmusic' ? 'music_songs' : 'videos';
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/search?q=${q}&filter=${filter}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items
          .filter((item: any) => item.url && item.title)
          .slice(0, 25)
          .map((item: any) => {
            const vid = (item.url || '').replace('/watch?v=', '');
            return {
              id: vid,
              title: item.title || 'Unknown Title',
              artist: (item.uploaderName || 'Unknown Artist').replace(/\s*-\s*Topic$/i, ''),
              duration: typeof item.duration === 'number' && item.duration > 0 ? item.duration : 210,
              thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              platform
            };
          });
      }
    } catch (_) {}
  }

  // 2. Fallback to Invidious API
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}/api/v1/search?q=${q}&type=video`);
      if (!res.ok) continue;
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        return items.slice(0, 25).map((item: any) => ({
          id: item.videoId,
          title: item.title || 'Unknown Title',
          artist: (item.author || 'Unknown Artist').replace(/\s*-\s*Topic$/i, ''),
          duration: item.lengthSeconds || 210,
          thumbnail:
            (item.videoThumbnails && item.videoThumbnails[0] && item.videoThumbnails[0].url) ||
            `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
          platform
        }));
      }
    } catch (_) {}
  }

  // 3. Fallback curated tracks if offline
  return getDefaultTrendingTracks();
}

export async function resolveStreamUrl(track: TrackItem): Promise<string> {
  if (track.localUri) return track.localUri;
  if (track.platform === 'soundcloud' && track.streamUrl) {
    const resolved = await resolveSoundCloudStream(track.streamUrl);
    if (resolved) return resolved;
  }
  if (track.streamUrl) return track.streamUrl;

  // Try Piped audio streams
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${encodeURIComponent(track.id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
        const sorted = [...data.audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const best = sorted.find((s) => s.mimeType?.includes('mp4') || s.mimeType?.includes('m4a')) || sorted[0];
        if (best && best.url) return best.url;
      }
    } catch (_) {}
  }

  // Try Invidious adaptiveFormats
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}/api/v1/videos/${encodeURIComponent(track.id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.adaptiveFormats)) {
        const audios = data.adaptiveFormats.filter((f: any) => f.type && f.type.startsWith('audio/'));
        if (audios.length > 0 && audios[0].url) return audios[0].url;
      }
    } catch (_) {}
  }

  // Reliable fallback royalty-free stream for testing if all instances rate-limit
  return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
}

export function getDefaultTrendingTracks(): TrackItem[] {
  return [
    {
      id: 'Y8JFxS1HlDo',
      title: 'LOVE DIVE',
      artist: 'IVE',
      album: 'LOVE DIVE',
      duration: 177,
      thumbnail: 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'ArmDp-zijuc',
      title: 'Super Shy',
      artist: 'NewJeans',
      album: 'Get Up',
      duration: 154,
      thumbnail: 'https://i.ytimg.com/vi/ArmDp-zijuc/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'dy90tA3TT1c',
      title: 'アイドル (Idol)',
      artist: 'YOASOBI',
      album: 'Idol',
      duration: 213,
      thumbnail: 'https://i.ytimg.com/vi/dy90tA3TT1c/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'SlPhMPnQ58k',
      title: 'Memories',
      artist: 'Maroon 5',
      album: 'Jordi',
      duration: 189,
      thumbnail: 'https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg',
      platform: 'ytmusic'
    }
  ];
}
