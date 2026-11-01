// TypeScript / src/services/playlistImport.ts / Expo React Native / External Playlist Importer

import { TrackItem, searchTracks } from './innertube';

export interface ImportedPlaylist {
  id: string;
  name: string;
  tracks: TrackItem[];
  createdAt: number;
}

export async function importExternalPlaylist(urlOrText: string): Promise<ImportedPlaylist> {
  const raw = (urlOrText || '').trim();
  const id = 'pl_' + Date.now();

  // Try fetching public Spotify embed JSON if it is a Spotify playlist link
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
            const tracks: TrackItem[] = entity.trackList.slice(0, 30).map((t: any, i: number) => ({
              id: t.uri || `sp_${playlistId}_${i}`,
              title: t.title || 'Unknown Track',
              artist: t.subtitle || 'Unknown Artist',
              duration: Math.round((t.duration || 180000) / 1000),
              thumbnail: entity.coverArt?.sources?.[0]?.url || 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
              platform: 'ytmusic'
            }));
            return {
              id,
              name: entity.name || entity.title || 'Spotify Imported Playlist',
              tracks,
              createdAt: Date.now()
            };
          }
        }
      }
    } catch (_) {}
  }

  // Fallback: treat input as search query or playlist name and populate matching tracks
  const found = await searchTracks(raw || 'Top Hits', 'ytmusic');
  return {
    id,
    name: raw.startsWith('http') ? 'Imported Playlist' : raw || 'My Playlist',
    tracks: found.slice(0, 15),
    createdAt: Date.now()
  };
}
