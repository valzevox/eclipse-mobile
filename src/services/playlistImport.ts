// TypeScript / src/services/playlistImport.ts / Expo React Native / Multi-Platform Playlist Importer (Spotify, YT Music, NetEase)

import { TrackItem, searchTracks } from './innertube';

export interface ImportedPlaylist {
  id: string;
  name: string;
  tracks: TrackItem[];
  createdAt: number;
}

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me'
];

export async function importExternalPlaylist(urlOrText: string): Promise<ImportedPlaylist> {
  const raw = (urlOrText || '').trim();
  const id = 'pl_' + Date.now();

  // 1. Spotify Playlist URL
  const spMatch = raw.match(/spotify\.com\/(?:intl-[a-z]+\/)?playlist\/([a-zA-Z0-9]+)/);
  if (spMatch) {
    const playlistId = spMatch[1];
    try {
      const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
      const res = await fetch(embedUrl);
      if (res.ok) {
        const html = await res.text();
        const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextMatch) {
          const json = JSON.parse(nextMatch[1]);
          const entity = json?.props?.pageProps?.state?.data?.entity;
          if (entity && Array.isArray(entity.trackList)) {
            const tracks: TrackItem[] = entity.trackList.slice(0, 35).map((t: any, i: number) => ({
              id: t.uri || `sp_${playlistId}_${i}`,
              title: t.title || 'Unknown Track',
              artist: t.subtitle || 'Unknown Artist',
              duration: Math.round((t.duration || 180000) / 1000),
              thumbnail: entity.coverArt?.sources?.[0]?.url || 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
              platform: 'ytmusic'
            }));
            return {
              id,
              name: entity.name || entity.title || 'Spotify Playlist',
              tracks,
              createdAt: Date.now()
            };
          }
        }
      }
    } catch (_) {}
  }

  // 2. YouTube / YouTube Music Playlist URL (list=PL...)
  const ytListMatch = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (ytListMatch) {
    const listId = ytListMatch[1];
    for (const base of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${base}/playlists/${encodeURIComponent(listId)}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.relatedStreams) && data.relatedStreams.length > 0) {
          const tracks: TrackItem[] = data.relatedStreams.slice(0, 40).map((item: any) => {
            const vid = (item.url || '').replace('/watch?v=', '');
            return {
              id: vid,
              title: item.title || 'Unknown Track',
              artist: (item.uploaderName || 'Unknown Artist').replace(/\s*-\s*Topic$/i, ''),
              duration: item.duration || 200,
              thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              platform: 'ytmusic'
            };
          });
          return {
            id,
            name: data.name || 'YouTube Music Playlist',
            tracks,
            createdAt: Date.now()
          };
        }
      } catch (_) {}
    }
  }

  // 3. NetEase Cloud Music Playlist URL (music.163.com/...id=12345)
  const neMatch = raw.match(/music\.163\.com.*[?&]id=(\d+)/);
  if (neMatch) {
    const neId = neMatch[1];
    try {
      const res = await fetch(`https://music.163.com/api/playlist/detail?id=${neId}`, {
        headers: { Referer: 'https://music.163.com' }
      });
      if (res.ok) {
        const data = await res.json();
        const result = data?.result;
        if (result && Array.isArray(result.tracks) && result.tracks.length > 0) {
          const tracks: TrackItem[] = result.tracks.slice(0, 35).map((t: any) => ({
            id: `ne_${t.id}`,
            title: t.name || 'Unknown Track',
            artist: (t.artists || []).map((a: any) => a.name).join(', ') || 'Unknown Artist',
            duration: Math.round((t.duration || 180000) / 1000),
            thumbnail: t.album?.picUrl || 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
            platform: 'ytmusic'
          }));
          return {
            id,
            name: result.name || 'NetEase Playlist',
            tracks,
            createdAt: Date.now()
          };
        }
      }
    } catch (_) {}
  }

  // Fallback: search query
  const found = await searchTracks(raw || 'Top Hits', 'ytmusic');
  return {
    id,
    name: raw.startsWith('http') ? 'Imported Playlist' : raw || 'My Playlist',
    tracks: found.slice(0, 15),
    createdAt: Date.now()
  };
}
