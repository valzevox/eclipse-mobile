// TypeScript / src/services/innertube.ts / Expo React Native / Direct Innertube iOS Stream Resolver & Zero-Latency Search
// Architected after Riff-Muriel 43.0.0 fetchDirectYoutubeStreamServer

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

export type ChartRegion = 'global' | 'vn' | 'jp' | 'kr';

const IOS_CLIENT_CONTEXT = {
  client: {
    clientName: 'IOS',
    clientVersion: '20.03.02',
    deviceMake: 'Apple',
    deviceModel: 'iPhone16,2',
    osName: 'iOS',
    osVersion: '18.2.1.22C161',
    hl: 'en',
    gl: 'US'
  }
};

const IOS_USER_AGENT = 'com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)';

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

// In-memory stream cache for zero-latency prefetch & instant re-play (3-hour TTL)
const streamCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export function isSyntheticTrackId(id: string): boolean {
  if (!id) return true;
  return (
    id.startsWith('sp_') ||
    id.startsWith('am_') ||
    id.startsWith('ym_') ||
    id.startsWith('ne_') ||
    id.startsWith('pl_') ||
    id.includes(':') ||
    id.includes('/') ||
    id.length !== 11
  );
}

export async function fetchDirectInnertubeAudio(videoId: string): Promise<string | null> {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': IOS_USER_AGENT
      },
      body: JSON.stringify({
        videoId,
        context: IOS_CLIENT_CONTEXT,
        contentCheckOk: true,
        racyCheckOk: true
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const formats = [
      ...((data.streamingData && data.streamingData.adaptiveFormats) || []),
      ...((data.streamingData && data.streamingData.formats) || [])
    ];
    const audioFormats = formats.filter(
      (f: any) => f && f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('audio/')
    );
    if (!audioFormats.length) return null;

    // Mobile hardware acceleration prefers MP4 / M4A (AAC), fallback to WebM Opus
    const m4a = audioFormats.filter((f: any) => f.mimeType.includes('mp4') || f.mimeType.includes('m4a'));
    const pool = m4a.length > 0 ? m4a : audioFormats;
    pool.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    return pool[0]?.url || null;
  } catch (_) {
    return null;
  }
}

export async function matchYouTubeVideoId(query: string): Promise<string | null> {
  if (!query || !query.trim()) return null;
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': IOS_USER_AGENT
      },
      body: JSON.stringify({
        query: query.trim(),
        context: IOS_CLIENT_CONTEXT
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = JSON.stringify(data);
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const match = regex.exec(raw);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

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

  // 1. Try Piped API
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

  // 2. Try Invidious API
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

  // 3. Fallback: Direct Innertube Search Regex Resolver
  try {
    const matchedVid = await matchYouTubeVideoId(query);
    if (matchedVid) {
      return [
        {
          id: matchedVid,
          title: query.trim(),
          artist: 'YouTube Music',
          duration: 210,
          thumbnail: `https://i.ytimg.com/vi/${matchedVid}/hqdefault.jpg`,
          platform
        }
      ];
    }
  } catch (_) {}

  return getDefaultTrendingTracks();
}

export async function resolveStreamUrl(track: TrackItem): Promise<string> {
  if (track.localUri) return track.localUri;
  if (track.platform === 'soundcloud' && track.streamUrl) {
    const resolved = await resolveSoundCloudStream(track.streamUrl);
    if (resolved) return resolved;
  }
  if (track.streamUrl && !track.streamUrl.includes('soundhelix')) return track.streamUrl;

  // 1. If ID is synthetic (Spotify `sp_...`, Apple `am_...`, NetEase `ne_...`, Yandex `ym_...`), match real YouTube video
  if (isSyntheticTrackId(track.id)) {
    const cleanTitle = (track.title || '').replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, '').trim();
    const cleanArtist = (track.artist || '').replace(/\s*-\s*Topic$/i, '').trim();
    const searchQuery = `${cleanArtist} - ${cleanTitle}`.trim();
    const matchedId = await matchYouTubeVideoId(searchQuery);
    if (matchedId) {
      track.id = matchedId;
    }
  }

  // 2. Memory cache check
  const cached = streamCache.get(track.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url;
  }

  // 3. Primary Engine: Direct YouTube Innertube iOS endpoint (Riff-Muriel 43.0.0 Architecture)
  if (/^[a-zA-Z0-9_-]{11}$/.test(track.id)) {
    const directUrl = await fetchDirectInnertubeAudio(track.id);
    if (directUrl) {
      streamCache.set(track.id, { url: directUrl, timestamp: Date.now() });
      return directUrl;
    }
  }

  // 4. Secondary fallback: If track.id failed or was wrong, retry matching once by query
  if (track.title && track.artist) {
    const cleanTitle = (track.title || '').replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, '').trim();
    const cleanArtist = (track.artist || '').replace(/\s*-\s*Topic$/i, '').trim();
    const searchQuery = `${cleanArtist} - ${cleanTitle}`.trim();
    const matchedId = await matchYouTubeVideoId(searchQuery);
    if (matchedId && matchedId !== track.id) {
      track.id = matchedId;
      const directUrl = await fetchDirectInnertubeAudio(matchedId);
      if (directUrl) {
        streamCache.set(track.id, { url: directUrl, timestamp: Date.now() });
        return directUrl;
      }
    }
  }

  // 5. Tertiary Fallback: Piped Instances
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${encodeURIComponent(track.id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
        const sorted = [...data.audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const best = sorted.find((s) => s.mimeType?.includes('mp4') || s.mimeType?.includes('m4a')) || sorted[0];
        if (best && best.url) {
          streamCache.set(track.id, { url: best.url, timestamp: Date.now() });
          return best.url;
        }
      }
    } catch (_) {}
  }

  // 6. Quaternary Fallback: Invidious Instances
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}/api/v1/videos/${encodeURIComponent(track.id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.adaptiveFormats)) {
        const audios = data.adaptiveFormats.filter((f: any) => f.type && f.type.startsWith('audio/'));
        if (audios.length > 0 && audios[0].url) {
          streamCache.set(track.id, { url: audios[0].url, timestamp: Date.now() });
          return audios[0].url;
        }
      }
    } catch (_) {}
  }

  return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
}

export async function prefetchNextTracks(tracks: TrackItem[]): Promise<void> {
  for (const t of tracks) {
    if (!t || t.localUri || t.streamUrl) continue;
    const cached = streamCache.get(t.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) continue;
    resolveStreamUrl(t).catch(() => {});
  }
}

export async function resolveVideoStreamUrl(track: TrackItem): Promise<string | null> {
  if (!track || track.platform === 'soundcloud' || track.platform === 'local') return null;
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${encodeURIComponent(track.id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.videoStreams) && data.videoStreams.length > 0) {
        const withAudio = data.videoStreams.filter((v: any) => !v.videoOnly && v.url);
        if (withAudio.length > 0) return withAudio[0].url;
      }
    } catch (_) {}
  }
  return null;
}

const REGIONAL_CHARTS: Record<ChartRegion, TrackItem[]> = {
  global: [
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
  ],
  vn: [
    {
      id: 'abPmZCZZrFA',
      title: 'Đừng Làm Trái Tim Anh Đau',
      artist: 'Sơn Tùng M-TP',
      album: 'Single',
      duration: 279,
      thumbnail: 'https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'FN7ALfpGxiI',
      title: 'Nơi Này Có Anh',
      artist: 'Sơn Tùng M-TP',
      album: 'M-TP',
      duration: 260,
      thumbnail: 'https://i.ytimg.com/vi/FN7ALfpGxiI/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'ukHK1GVyr0I',
      title: 'Waiting For You',
      artist: 'MONO',
      album: '22',
      duration: 266,
      thumbnail: 'https://i.ytimg.com/vi/ukHK1GVyr0I/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'Llw9Q6akRo4',
      title: 'See Tình',
      artist: 'Hoàng Thùy Linh',
      album: 'LINK',
      duration: 185,
      thumbnail: 'https://i.ytimg.com/vi/Llw9Q6akRo4/hqdefault.jpg',
      platform: 'ytmusic'
    }
  ],
  jp: [
    {
      id: 'dy90tA3TT1c',
      title: 'アイドル (Idol)',
      artist: 'YOASOBI',
      album: 'THE BOOK 3',
      duration: 213,
      thumbnail: 'https://i.ytimg.com/vi/dy90tA3TT1c/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'x8VYWazR5mE',
      title: '夜に駆ける (Yoru ni Kakeru)',
      artist: 'YOASOBI',
      album: 'THE BOOK',
      duration: 261,
      thumbnail: 'https://i.ytimg.com/vi/x8VYWazR5mE/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'M2cckDmNLMI',
      title: 'KICK BACK',
      artist: 'Kenshi Yonezu',
      album: 'KICK BACK',
      duration: 193,
      thumbnail: 'https://i.ytimg.com/vi/M2cckDmNLMI/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'ony539T074w',
      title: 'Subtitle',
      artist: 'Official HIGE DANdism',
      album: 'Subtitle',
      duration: 309,
      thumbnail: 'https://i.ytimg.com/vi/ony539T074w/hqdefault.jpg',
      platform: 'ytmusic'
    }
  ],
  kr: [
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
      id: 'Y8JFxS1HlDo',
      title: 'LOVE DIVE',
      artist: 'IVE',
      album: 'LOVE DIVE',
      duration: 177,
      thumbnail: 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'sVTy_wmn5SU',
      title: 'OMG',
      artist: 'NewJeans',
      album: 'OMG',
      duration: 212,
      thumbnail: 'https://i.ytimg.com/vi/sVTy_wmn5SU/hqdefault.jpg',
      platform: 'ytmusic'
    },
    {
      id: 'Os_heh8vPfs',
      title: 'Spicy',
      artist: 'aespa',
      album: 'MY WORLD',
      duration: 197,
      thumbnail: 'https://i.ytimg.com/vi/Os_heh8vPfs/hqdefault.jpg',
      platform: 'ytmusic'
    }
  ]
};

export function getDefaultTrendingTracks(region: ChartRegion = 'global'): TrackItem[] {
  return REGIONAL_CHARTS[region] || REGIONAL_CHARTS.global;
}
