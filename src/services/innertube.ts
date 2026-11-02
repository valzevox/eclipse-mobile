// TypeScript / src/services/innertube.ts / Expo React Native / Direct Innertube iOS Stream Resolver & WEB_REMIX Zero-Latency Search
// Architected after Riff-Muriel 43.0.0 fetchDirectYoutubeStreamServer, parseSmartArtistAndTitle & ytmSearchRequest

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

const ANDROID_VR_CLIENT_CONTEXT = {
  client: {
    clientName: 'ANDROID_VR',
    clientVersion: '1.60.19',
    androidSdkVersion: 34,
    osName: 'Android',
    osVersion: '14',
    hl: 'en',
    gl: 'US'
  }
};

const ANDROID_VR_USER_AGENT =
  'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 14; eureka-user Build/SQ3A.220605.009.A1) gzip';

const YTM_CLIENT_CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20250101.01.00',
    hl: 'en',
    gl: 'US'
  }
};

const WEB_CLIENT_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20250101.00.00',
    hl: 'en',
    gl: 'US'
  }
};

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const YTM_SONGS_PARAMS = 'EgWKAQIIAWoMEA4QChADEAQQCRAF';

// In-memory stream & search cache for zero-latency prefetch & instant re-play (3-hour TTL)
const streamCache = new Map<string, { url: string; timestamp: number }>();
const searchCache = new Map<string, { tracks: TrackItem[]; timestamp: number }>();
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

// -----------------------------------------------------------------------------
// parseSmartArtistAndTitle (Ported from Riff-Muriel app.js L758-L860)
// Strips YouTube badges, separates "Artist - Song", and cleans metadata for 100% accurate lyrics & playback
// -----------------------------------------------------------------------------
const KNOWN_ARTISTS = [
  'mck', 'rdm mck', 'hoo', 'notchaos', 'w/n', 'lowkid', 'cupid', 'kiddi', 'thanhluan', 'thanh luan',
  'sơn tùng m-tp', 'đen', 'vũ', 'tlinh', 'hieuthuhai', 'wrxdie', 'wxrdie', 'gill',
  'b ray', 'masew', 'soobin hoàng sơn', 'soobin', 'mono', 'justatee', 'rhymastic',
  'dangrangto', 'eren', 'drzey', 'honlieu', 'stormie', 'fishy', 'nguyên', 'nguyên.',
  'kidsai', 'bbynascar', '2pillz', 'younghao', 'left hand', 'lil liem', 'taki',
  'vstra', 'hngle', 'bảo anh', 'wren evans', 'newjeans', 'ive', 'aespa', 'yoasobi',
  'kenshi yonezu', 'taylor swift', 'maroon 5', 'billie eilish', 'the weeknd', 'coldplay'
];

export function parseSmartArtistAndTitle(rawTitle: string, rawArtist: string): { title: string; artist: string } {
  let title = String(rawTitle || '').trim();
  let artist = String(rawArtist || '')
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\bVEVO$/i, '')
    .replace(/\s+Official$/i, '')
    .trim();

  const stripBadges = (str: string) => {
    return str
      .replace(/\s*\|\s*(?:official\s*(?:music\s*)?(?:video|audio|lyrics?\s*video)|lyrics?\s*video|official\s*m\/?v|mv|visualizer).*$/gi, '')
      .replace(/\s*-\s*(?:official\s*(?:music\s*)?(?:video|audio|lyric\s*video)|lyric\s*video|official\s*video).*$/gi, '')
      .replace(/\s*[\(\[]\s*(?:official\s*(?:music\s*)?(?:video|audio|lyric\s*video|visualizer|mv)|lyrics?\s*video|lyrics?|visualizer|hd|hq|4k|remastered\s*\d*|mv|clip\s*officiel|audio|official\s*video|official)\s*[\)\]]/gi, '')
      .trim();
  };

  title = stripBadges(title);
  artist = stripBadges(artist);

  const matchesKnownArtist = (s: string) => {
    if (!s) return false;
    const norm = s.toLowerCase().replace(/\s+official$/i, '').trim();
    return KNOWN_ARTISTS.some(a => norm === a || norm.startsWith(a + ' ') || norm.endsWith(' ' + a) || norm.includes(' ' + a + ' '));
  };

  const featPattern = /(?:[\(\[]\s*|\s+)(?:ft\.?|feat\.?|featuring|prod\.?)\s*([^\)\]]+)[\)\]]?/i;

  // Split on " - ", " – ", " — "
  const sepMatch = title.match(/^(.+?)\s+(?:[-–—]|\/\/)\s+(.+)$/);
  if (sepMatch) {
    const left = sepMatch[1].trim();
    const right = sepMatch[2].trim();
    const normLeft = left.toLowerCase();
    const normRight = right.toLowerCase();
    const normA = artist.toLowerCase().replace(/\s+official$/i, '').trim();

    const leftIsArtist = matchesKnownArtist(left) || (normA && (normLeft === normA || normLeft.startsWith(normA)));
    const rightIsArtist = matchesKnownArtist(right) || (normA && (normRight === normA || normRight.startsWith(normA)));

    if (rightIsArtist && !leftIsArtist) {
      artist = right;
      title = left;
    } else if (leftIsArtist && !rightIsArtist) {
      artist = left;
      title = right;
    } else {
      artist = left;
      title = right;
    }
  }

  title = stripBadges(title);
  artist = stripBadges(artist);

  const featMatch = title.match(featPattern);
  if (featMatch) {
    const featStr = stripBadges(featMatch[0]).replace(/^[\(\[\s]+/, '').replace(/[\)\]\s]+$/, '');
    const cleanT = stripBadges(title.replace(featMatch[0], '')).trim();
    if (cleanT.length >= 2) {
      title = cleanT;
      if (!artist.toLowerCase().includes(featStr.toLowerCase())) {
        artist = artist ? `${artist} (${featStr})` : featStr;
      }
    }
  }

  title = title.replace(/^['"“‘]+|['"”’]+$/g, '').trim();
  return {
    title: title || 'Unknown Title',
    artist: artist || 'Unknown Artist'
  };
}

function parseDurationText(text?: string): number {
  if (!text || !/^\d+(:\d{1,2}){1,2}$/.test(text.trim())) return 0;
  return text
    .trim()
    .split(':')
    .map(Number)
    .reduce((acc, n) => acc * 60 + n, 0);
}

export function parseYtmSongs(json: any, platform: 'ytmusic' | 'youtube' = 'ytmusic'): TrackItem[] {
  const out: TrackItem[] = [];
  const tabs = json?.contents?.tabbedSearchResultsRenderer?.tabs || [];
  const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  for (const section of sections) {
    const items: any[] = [];
    if (Array.isArray(section?.musicShelfRenderer?.contents)) {
      items.push(...section.musicShelfRenderer.contents);
    }
    if (Array.isArray(section?.itemSectionRenderer?.contents)) {
      items.push(...section.itemSectionRenderer.contents);
    }
    if (Array.isArray(section?.musicCardShelfRenderer?.contents)) {
      items.push(...section.musicCardShelfRenderer.contents);
    }
    for (const wrap of items) {
      const r = wrap?.musicResponsiveListItemRenderer;
      if (!r) continue;
      const cols = r.flexColumns || [];
      const runsOf = (i: number) =>
        cols[i]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const overlay =
        r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer;
      const videoId =
        r.playlistItemData?.videoId ||
        overlay?.playNavigationEndpoint?.watchEndpoint?.videoId;
      if (!videoId || !/^[\w-]{11}$/.test(videoId)) continue;

      const rawTitle = runsOf(0)
        .map((x: any) => x.text)
        .join('')
        .trim();
      const segments: string[] = [];
      let cur: string[] = [];
      for (const run of runsOf(1)) {
        if (run.text === ' • ') {
          segments.push(cur.join('').trim());
          cur = [];
        } else {
          cur.push(run.text);
        }
      }
      segments.push(cur.join('').trim());
      const clean = segments.filter((s) => s && !/^(song|video)$/i.test(s));
      let duration = 0;
      if (clean.length && parseDurationText(clean[clean.length - 1])) {
        duration = parseDurationText(clean.pop());
      }
      const rawArtist = clean[0] || 'Unknown Artist';
      const album = clean[1] || '';

      const { title, artist } = parseSmartArtistAndTitle(rawTitle, rawArtist);

      const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      let thumbnail = thumbs.length
        ? thumbs[thumbs.length - 1].url
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      thumbnail = thumbnail.replace(/=w\d+-h\d+[^&]*$/, '=w544-h544');

      if (!title) continue;
      out.push({
        id: videoId,
        title,
        artist,
        album,
        duration: duration || 200,
        thumbnail,
        platform
      });
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Direct Innertube Audio Stream Extraction (Riff-Muriel Promise.any iOS + ANDROID_VR)
// -----------------------------------------------------------------------------
export async function fetchDirectInnertubeAudio(videoId: string): Promise<string | null> {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;

  const clients = [
    { context: IOS_CLIENT_CONTEXT, ua: IOS_USER_AGENT },
    { context: ANDROID_VR_CLIENT_CONTEXT, ua: ANDROID_VR_USER_AGENT }
  ];

  const queryClient = async (c: { context: any; ua: string }) => {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': c.ua
      },
      body: JSON.stringify({
        videoId,
        context: c.context,
        contentCheckOk: true,
        racyCheckOk: true
      })
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    const formats = [
      ...((data.streamingData && data.streamingData.adaptiveFormats) || []),
      ...((data.streamingData && data.streamingData.formats) || [])
    ];
    const audioFormats = formats.filter(
      (f: any) => f && f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('audio/')
    );
    if (!audioFormats.length) throw new Error('no audio formats');

    const m4a = audioFormats.filter((f: any) => f.mimeType.includes('mp4') || f.mimeType.includes('m4a'));
    const pool = m4a.length > 0 ? m4a : audioFormats;
    pool.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    return pool[0]?.url || null;
  };

  try {
    const url = await Promise.any(clients.map(queryClient));
    return url;
  } catch (_) {
    return null;
  }
}

export async function matchYouTubeVideoId(query: string): Promise<string | null> {
  if (!query || !query.trim()) return null;
  try {
    const res = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://music.youtube.com',
        Referer: 'https://music.youtube.com/',
        'User-Agent': DESKTOP_USER_AGENT
      },
      body: JSON.stringify({
        context: YTM_CLIENT_CONTEXT,
        query: query.trim(),
        params: YTM_SONGS_PARAMS
      })
    });
    if (res.ok) {
      const json = await res.json();
      const songs = parseYtmSongs(json, 'ytmusic');
      if (songs.length > 0) return songs[0].id;
    }
  } catch (_) {}

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
  const cleanQ = query.trim();

  if (platform === 'soundcloud') {
    const scResults = await searchSoundCloud(cleanQ);
    if (scResults.length > 0) return scResults;
  }

  const cacheKey = `${platform}:${cleanQ.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.tracks;
  }

  // 1. Primary Fast Engine: YouTube Music WEB_REMIX Direct Innertube (~400ms)
  try {
    const bodyPayload: any = {
      context: YTM_CLIENT_CONTEXT,
      query: cleanQ
    };
    if (platform === 'ytmusic') {
      bodyPayload.params = YTM_SONGS_PARAMS;
    }
    const res = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://music.youtube.com',
        Referer: 'https://music.youtube.com/',
        'User-Agent': DESKTOP_USER_AGENT
      },
      body: JSON.stringify(bodyPayload)
    });
    if (res.ok) {
      const json = await res.json();
      const parsed = parseYtmSongs(json, platform === 'soundcloud' ? 'ytmusic' : platform);
      if (parsed.length > 0) {
        searchCache.set(cacheKey, { tracks: parsed, timestamp: Date.now() });
        return parsed;
      }
    }
  } catch (_) {}

  // 2. Secondary Fast Engine: Direct YouTube WEB Innertube Search (~500ms)
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': DESKTOP_USER_AGENT
      },
      body: JSON.stringify({
        context: WEB_CLIENT_CONTEXT,
        query: cleanQ
      })
    });
    if (res.ok) {
      const json = await res.json();
      const contents =
        json?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
        json?.contents?.sectionListRenderer?.contents ||
        [];
      const tracks: TrackItem[] = [];
      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (tracks.length >= 25) break;
          const v = item?.videoRenderer;
          if (v && v.videoId) {
            const vidId = v.videoId;
            const rawTitle = v.title?.runs?.[0]?.text || 'Unknown Title';
            const rawArtist = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube';
            const { title, artist } = parseSmartArtistAndTitle(rawTitle, rawArtist);
            const durSec = parseDurationText(v.lengthText?.simpleText) || 200;
            const thumbs = v.thumbnail?.thumbnails || [];
            const thumbnail = thumbs.length
              ? thumbs[thumbs.length - 1].url
              : `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
            tracks.push({
              id: vidId,
              title,
              artist,
              duration: durSec,
              thumbnail,
              platform: platform === 'soundcloud' ? 'youtube' : platform
            });
          }
        }
      }
      if (tracks.length > 0) {
        searchCache.set(cacheKey, { tracks, timestamp: Date.now() });
        return tracks;
      }
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

  // 1. Only resolve ID via search if ID is SYNTHETIC (starts with sp_, am_, ym_, ne_, etc.)
  // Never overwrite or re-search valid 11-char YouTube IDs that came from a real playlist!
  if (isSyntheticTrackId(track.id)) {
    const cleanTitle = (track.title || '').replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, '').trim();
    const cleanArtist = (track.artist || '').replace(/\s*-\s*Topic$/i, '').trim();
    const searchQuery = `${cleanArtist} - ${cleanTitle}`.trim();
    const matchedId = await matchYouTubeVideoId(searchQuery);
    if (matchedId) {
      track.id = matchedId;
    }
  }

  // 2. Memory stream cache check
  const cached = streamCache.get(track.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.url;
  }

  // 3. Direct Innertube Player resolution for the exact YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(track.id)) {
    const directUrl = await fetchDirectInnertubeAudio(track.id);
    if (directUrl) {
      streamCache.set(track.id, { url: directUrl, timestamp: Date.now() });
      return directUrl;
    }
  }

  // 4. Fallback only if track.id was invalid or deleted video
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
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': IOS_USER_AGENT
      },
      body: JSON.stringify({
        videoId: track.id,
        context: IOS_CLIENT_CONTEXT,
        contentCheckOk: true,
        racyCheckOk: true
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const formats = [
      ...((data.streamingData && data.streamingData.formats) || []),
      ...((data.streamingData && data.streamingData.adaptiveFormats) || [])
    ];
    const video = formats.find(
      (f: any) => f && f.url && typeof f.mimeType === 'string' && f.mimeType.startsWith('video/mp4')
    );
    return video?.url || null;
  } catch (_) {
    return null;
  }
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
