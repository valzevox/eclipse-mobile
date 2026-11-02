// TypeScript / src/services/playlistImport.ts / Expo React Native / Multi-Platform Playlist Importer (Direct Innertube Browse, Spotify Pathfinder & Tree Walker, Apple Music, Yandex, NetEase)
// Ported from Riff-Muriel 43.0.0 server.js

import { TrackItem, searchTracks, parseSmartArtistAndTitle } from './innertube';

export interface ImportedPlaylist {
  id: string;
  name: string;
  tracks: TrackItem[];
  createdAt: number;
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SPOTIFY_PATHFINDER_URL = 'https://api-partner.spotify.com/pathfinder/v1/query';
const SPOTIFY_FETCH_PLAYLIST_HASHES = [
  'a65e12194ed5fc443a1cdebed5fabe33ca5b07b987185d63c72483867ad13cb4',
  '8964e8eafb21aa992a7d951d256d83285c04be2105d209262901de70cb97584a'
];

function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.simpleText) return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((r: any) => r.text || '').join('');
  return '';
}

function parseDurationSec(text: string): number {
  if (!text || !/^\d+(:\d{1,2}){1,2}$/.test(text.trim())) return 0;
  return text
    .trim()
    .split(':')
    .map(Number)
    .reduce((acc, n) => acc * 60 + n, 0);
}

function extractTracksFromInnertubeBrowse(root: any): { name: string; tracks: TrackItem[] } {
  const tracks: TrackItem[] = [];
  const seenIds = new Set<string>();
  let playlistTitle = '';

  function walk(node: any, visited = new Set<any>()) {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    if (!playlistTitle && (node.musicResponsiveHeaderRenderer || node.musicDetailHeaderRenderer || node.playlistMetadataRenderer)) {
      const hdr = node.musicResponsiveHeaderRenderer || node.musicDetailHeaderRenderer || node.playlistMetadataRenderer;
      playlistTitle = (extractText(hdr.title) || hdr.title || '').trim();
    }

    if (node.musicResponsiveListItemRenderer) {
      const r = node.musicResponsiveListItemRenderer;
      let videoId = r.playlistItemData?.videoId || null;
      if (!videoId) {
        const findVid = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.watchEndpoint && typeof obj.watchEndpoint.videoId === 'string') return obj.watchEndpoint.videoId;
          for (const k of Object.keys(obj)) {
            const v = findVid(obj[k]);
            if (v) return v;
          }
          return null;
        };
        videoId = findVid(r);
      }
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        const rawTitle =
          extractText(r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text) || 'Unknown Track';
        let rawArtist = '';
        const col1Runs = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
        if (Array.isArray(col1Runs) && col1Runs.length > 0) {
          rawArtist = col1Runs[0].text || '';
        } else {
          rawArtist = extractText(r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text);
        }
        const { artist, title } = parseSmartArtistAndTitle(rawTitle, rawArtist);

        let duration = 200;
        const findDur = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          if (Array.isArray(obj.runs)) {
            for (const ru of obj.runs) {
              if (ru && ru.text && /^\d+:\d+(:\d+)?$/.test(ru.text.trim())) {
                duration = parseDurationSec(ru.text.trim()) || 200;
                return;
              }
            }
          }
          for (const k of Object.keys(obj)) {
            if (duration === 200) findDur(obj[k]);
          }
        };
        findDur(r);
        const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
        const thumbnail =
          Array.isArray(thumbs) && thumbs.length > 0
            ? thumbs[thumbs.length - 1].url
            : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        tracks.push({ id: videoId, title, artist, duration, thumbnail, platform: 'ytmusic' });
      }
    } else if (node.playlistVideoRenderer || node.videoRenderer || node.compactVideoRenderer) {
      const r = node.playlistVideoRenderer || node.videoRenderer || node.compactVideoRenderer;
      const videoId = r.videoId;
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        const rawTitle = extractText(r.title) || 'Unknown Track';
        const rawArtist = extractText(r.shortBylineText) || extractText(r.ownerText) || 'Unknown Artist';
        const { artist, title } = parseSmartArtistAndTitle(rawTitle, rawArtist);
        const duration = r.lengthSeconds
          ? parseInt(String(r.lengthSeconds), 10)
          : parseDurationSec(extractText(r.lengthText)) || 200;
        const thumbs = r.thumbnail?.thumbnails || r.thumbnails?.[0]?.thumbnails;
        const thumbnail =
          Array.isArray(thumbs) && thumbs.length > 0
            ? thumbs[thumbs.length - 1].url
            : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        tracks.push({ id: videoId, title, artist, duration, thumbnail, platform: 'ytmusic' });
      }
    }

    if (Array.isArray(node)) {
      for (const item of node) walk(item, visited);
    } else {
      for (const k of Object.keys(node)) walk(node[k], visited);
    }
  }

  walk(root);
  return { name: playlistTitle || 'YouTube Music Playlist', tracks };
}

async function fetchSpotifyPathfinder(playlistId: string, accessToken: string): Promise<TrackItem[]> {
  const uri = `spotify:playlist:${playlistId}`;
  for (const hash of SPOTIFY_FETCH_PLAYLIST_HASHES) {
    try {
      const res = await fetch(SPOTIFY_PATHFINDER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Referer: 'https://open.spotify.com/',
          'User-Agent': DESKTOP_UA
        },
        body: JSON.stringify({
          variables: { uri, offset: 0, limit: 100, enableWatchFeedEntrypoint: true },
          operationName: 'fetchPlaylist',
          extensions: { persistedQuery: { version: 1, sha256Hash: hash } }
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.data?.playlistV2?.content?.items;
      if (Array.isArray(items) && items.length > 0) {
        const out: TrackItem[] = [];
        items.forEach((it: any, idx: number) => {
          const t = it?.itemV2?.data || it?.item?.data || {};
          const title = (t.name || '').trim();
          if (!title) return;
          const artists = (t.albumOfTrack?.artists?.items || [])
            .map((a: any) => a.profile?.name)
            .filter(Boolean);
          const durationMs =
            t.trackDuration?.totalMilliseconds || t.duration?.totalMilliseconds || t.duration_ms || 180000;
          const sources = t.albumOfTrack?.coverArt?.sources || [];
          const cover = sources.length
            ? sources[sources.length - 1].url
            : 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg';
          out.push({
            id: `sp_${playlistId}_${idx}`,
            title,
            artist: artists.join(', ') || 'Unknown Artist',
            duration: Math.round(durationMs / 1000),
            thumbnail: cover,
            platform: 'ytmusic'
          });
        });
        if (out.length > 0) return out;
      }
    } catch (_) {}
  }
  return [];
}

export async function importExternalPlaylist(urlOrText: string): Promise<ImportedPlaylist> {
  const raw = (urlOrText || '').trim();
  const id = 'pl_' + Date.now();

  // 1. Spotify Playlist URL (open.spotify.com/playlist/... or spotify:playlist:...)
  const spMatch = raw.match(
    /(?:open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(?:embed\/)?playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/
  );
  if (spMatch) {
    const playlistId = spMatch[1];
    try {
      const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': DESKTOP_UA,
          Accept: 'text/html,application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://open.spotify.com/'
        }
      });
      if (res.ok) {
        const html = await res.text();
        const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextMatch) {
          const data = JSON.parse(nextMatch[1]);
          const pageProps = data?.props?.pageProps;
          const entity = pageProps?.state?.data?.entity;
          const name = entity?.name || entity?.title || pageProps?.title || 'Spotify Playlist';
          const defaultCover =
            entity?.coverArt?.sources?.[0]?.url ||
            entity?.images?.[0]?.url ||
            'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg';

          // Try Pathfinder full playlist first
          const accessToken = pageProps?.state?.settings?.session?.accessToken;
          if (accessToken) {
            const fullTracks = await fetchSpotifyPathfinder(playlistId, accessToken);
            if (fullTracks.length > 0) {
              return { id, name, tracks: fullTracks, createdAt: Date.now() };
            }
          }

          // Fallback A: entity.trackList
          if (Array.isArray(entity?.trackList) && entity.trackList.length > 0) {
            const tracks: TrackItem[] = entity.trackList.slice(0, 100).map((t: any, i: number) => ({
              id: `sp_${playlistId}_${i}`,
              title: (t.title || t.name || 'Unknown Track').trim(),
              artist: (t.subtitle || t.artist || 'Unknown Artist').trim(),
              duration: Math.round((t.duration || t.duration_ms || 180000) / 1000),
              thumbnail: t.image || t.coverArt?.sources?.[0]?.url || defaultCover,
              platform: 'ytmusic'
            }));
            return { id, name, tracks, createdAt: Date.now() };
          }

          // Fallback B: Recursive tree walker (Riff-Muriel 43.0.0)
          const walked: TrackItem[] = [];
          const seen = new Set<string>();
          function walkSpotify(node: any) {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
              for (const item of node) walkSpotify(item);
              return;
            }
            const uri = typeof node.uri === 'string' ? node.uri : '';
            const title = node.title || node.name;
            const subtitle =
              node.subtitle ||
              node.artist ||
              (Array.isArray(node.artists)
                ? node.artists
                    .map((a: any) => (typeof a === 'string' ? a : a.name || a.profile?.name))
                    .filter(Boolean)
                    .join(', ')
                : '');
            const durRaw =
              node.duration?.totalMilliseconds ||
              node.trackDuration?.totalMilliseconds ||
              node.duration_ms ||
              (typeof node.duration === 'number' ? node.duration : 0);
            if (
              title &&
              typeof title === 'string' &&
              (subtitle || uri.startsWith('spotify:track:')) &&
              (uri.startsWith('spotify:track:') || node.entityType === 'track' || durRaw)
            ) {
              const key = `${title}__${subtitle || ''}`;
              if (!seen.has(key)) {
                seen.add(key);
                const durSec =
                  typeof durRaw === 'number'
                    ? durRaw > 1000
                      ? Math.round(durRaw / 1000)
                      : Math.round(durRaw)
                    : 180;
                walked.push({
                  id: `sp_${playlistId}_${walked.length}`,
                  title: title.trim(),
                  artist: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : 'Spotify Artist',
                  duration: durSec || 180,
                  thumbnail: node.image || node.coverArt?.sources?.[0]?.url || defaultCover,
                  platform: 'ytmusic'
                });
              }
              return;
            }
            for (const k of Object.keys(node)) walkSpotify(node[k]);
          }
          walkSpotify(data);
          if (walked.length > 0) {
            return { id, name, tracks: walked.slice(0, 100), createdAt: Date.now() };
          }
        }
      }
    } catch (_) {}
  }

  // 2. Apple Music Album or Playlist URL (music.apple.com)
  const appleAlbumMatch = raw.match(/music\.apple\.com\/(?:[a-z]{2}\/)?album\/(?:[^/]+\/)?(\d+)/i);
  if (appleAlbumMatch) {
    try {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${appleAlbumMatch[1]}&entity=song`);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const col = results.find((r: any) => r.wrapperType === 'collection');
        const songs = results.filter((r: any) => r.wrapperType === 'track');
        if (songs.length > 0) {
          const tracks: TrackItem[] = songs.slice(0, 60).map((item: any, idx: number) => ({
            id: `am_${item.trackId || idx}`,
            title: item.trackName || 'Unknown Track',
            artist: item.artistName || col?.artistName || 'Unknown Artist',
            duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 200,
            thumbnail:
              (item.artworkUrl100 || col?.artworkUrl100 || '').replace('100x100', '600x600') ||
              'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
            platform: 'ytmusic'
          }));
          return {
            id,
            name: col?.collectionName || 'Apple Music Album',
            tracks,
            createdAt: Date.now()
          };
        }
      }
    } catch (_) {}
  }

  const applePlMatch = raw.match(/music\.apple\.com\/.*?(pl\.(?:u-)?[a-zA-Z0-9_-]+)/i);
  if (applePlMatch) {
    try {
      const res = await fetch(raw, {
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (res.ok) {
        const html = await res.text();
        let parsedData: any = null;
        const serverDataMatch = html.match(
          /<script\s+type=["']application\/json["']\s+id=["']serialized-server-data["'][^>]*>([\s\S]*?)<\/script>/i
        );
        if (serverDataMatch) {
          try {
            parsedData = JSON.parse(serverDataMatch[1]);
          } catch (_) {}
        }
        if (!parsedData) {
          const ldMatch = html.match(
            /<script\s+id=["']schema:music-playlist["']\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
          );
          if (ldMatch) {
            try {
              parsedData = JSON.parse(ldMatch[1]);
            } catch (_) {}
          }
        }
        if (parsedData) {
          const tracks: TrackItem[] = [];
          const seen = new Set<string>();
          let plTitle = '';
          function walkApple(node: any) {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
              for (const item of node) walkApple(item);
              return;
            }
            if (!plTitle && (node.contentDescriptor?.kind === 'playlist' || node.type === 'playlists' || node['@type'] === 'MusicPlaylist')) {
              plTitle = node.title || node.name || node.attributes?.name || '';
            }
            const title = (
              typeof node.title === 'string'
                ? node.title
                : typeof node.name === 'string' && (node['@type'] === 'MusicRecording' || node.type === 'songs')
                ? node.name
                : ''
            ).trim();
            const artist = (
              typeof node.artistName === 'string'
                ? node.artistName
                : typeof node.artist === 'string'
                ? node.artist
                : typeof node.byArtist?.name === 'string'
                ? node.byArtist.name
                : ''
            ).trim();
            const durRaw = node.durationInMillis || node.duration || node.duration_ms;
            let duration = 200;
            if (typeof durRaw === 'number') {
              duration = durRaw > 1000 ? Math.round(durRaw / 1000) : Math.round(durRaw);
            }
            if (title && artist) {
              const key = `${title.toLowerCase()}___${artist.toLowerCase()}`;
              if (!seen.has(key)) {
                seen.add(key);
                let artUrl = node.artwork?.dictionary?.url || node.artwork?.url || '';
                if (artUrl) artUrl = artUrl.replace('{w}x{h}bb.{f}', '600x600bb.jpg').replace('{w}x{h}', '600x600');
                tracks.push({
                  id: `am_pl_${tracks.length}`,
                  title,
                  artist,
                  duration,
                  thumbnail: artUrl || 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
                  platform: 'ytmusic'
                });
              }
              return;
            }
            for (const k of Object.keys(node)) walkApple(node[k]);
          }
          walkApple(parsedData);
          if (tracks.length > 0) {
            return {
              id,
              name: plTitle || 'Apple Music Playlist',
              tracks: tracks.slice(0, 80),
              createdAt: Date.now()
            };
          }
        }
      }
    } catch (_) {}
  }

  // 3. Yandex Music Playlist URL
  const ymUsers = raw.match(/users\/([^/?#]+)\/playlists\/(\d+)/i);
  if (ymUsers) {
    try {
      const res = await fetch(`https://api.music.yandex.net/users/${ymUsers[1]}/playlists/${ymUsers[2]}`, {
        headers: {
          'User-Agent': 'Yandex-Music-API',
          'X-Yandex-Music-Client': 'YandexMusicAndroid/24023231',
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const r = data?.result || data;
        const rawTracks = Array.isArray(r?.tracks) ? r.tracks : [];
        if (rawTracks.length > 0) {
          const tracks: TrackItem[] = rawTracks.slice(0, 60).map((item: any, idx: number) => {
            const t = item.track || item;
            const coverUri = t.ogImage || t.coverUri || t.albums?.[0]?.coverUri || '';
            return {
              id: `ym_${t.id || idx}`,
              title: t.title || 'Unknown Track',
              artist: Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist',
              duration: t.durationMs ? Math.round(t.durationMs / 1000) : 200,
              thumbnail: coverUri
                ? `https://${coverUri.replace('%%', '400x400')}`
                : 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
              platform: 'ytmusic'
            };
          });
          return {
            id,
            name: r?.title || 'Yandex Music Playlist',
            tracks,
            createdAt: Date.now()
          };
        }
      }
    } catch (_) {}
  }

  // 4. YouTube / YouTube Music Playlist URL or Raw ID (Direct Innertube youtubei/v1/browse — Zero Proxy Dependency)
  const ytListMatch = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/) || raw.match(/^(?:PL|VL|RD|OLAK5uy_)([a-zA-Z0-9_-]+)$/i);
  if (ytListMatch) {
    const rawListId = ytListMatch[1].startsWith('PL') || ytListMatch[1].startsWith('VL') || ytListMatch[1].startsWith('RD') || ytListMatch[1].startsWith('OLAK5uy_')
      ? ytListMatch[1]
      : ytListMatch[0].replace(/^[?&]list=/, '');
    const browseId = rawListId.startsWith('VL') ? rawListId : `VL${rawListId}`;
    try {
      const res = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://music.youtube.com',
          Referer: 'https://music.youtube.com/',
          'User-Agent': DESKTOP_UA
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB_REMIX',
              clientVersion: '1.20250101.01.00',
              hl: 'en',
              gl: 'US'
            }
          },
          browseId
        })
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = extractTracksFromInnertubeBrowse(json);
        if (parsed.tracks.length > 0) {
          return {
            id,
            name: parsed.name,
            tracks: parsed.tracks.slice(0, 100),
            createdAt: Date.now()
          };
        }
      }
    } catch (_) {}

    // Secondary YouTube WEB Browse fallback
    try {
      const resWeb = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': DESKTOP_UA
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20250101.00.00',
              hl: 'en',
              gl: 'US'
            }
          },
          browseId
        })
      });
      if (resWeb.ok) {
        const jsonWeb = await resWeb.json();
        const parsedWeb = extractTracksFromInnertubeBrowse(jsonWeb);
        if (parsedWeb.tracks.length > 0) {
          return {
            id,
            name: parsedWeb.name,
            tracks: parsedWeb.tracks.slice(0, 100),
            createdAt: Date.now()
          };
        }
      }
    } catch (_) {}
  }

  // 5. NetEase Cloud Music Playlist URL (music.163.com/...id=12345)
  const neMatch = raw.match(/music\.163\.com.*[?&]id=(\d+)/);
  if (neMatch) {
    const neId = neMatch[1];
    try {
      const res = await fetch(`https://music.163.com/api/playlist/detail?id=${neId}`, {
        headers: { Referer: 'https://music.163.com', 'User-Agent': DESKTOP_UA }
      });
      if (res.ok) {
        const data = await res.json();
        const result = data?.result;
        if (result && Array.isArray(result.tracks) && result.tracks.length > 0) {
          const tracks: TrackItem[] = result.tracks.slice(0, 60).map((t: any) => ({
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

  // Fallback: Direct Innertube search query
  const cleanQuery = raw.startsWith('http') ? 'Top Hits Global' : raw || 'Top Hits';
  const found = await searchTracks(cleanQuery, 'ytmusic');
  return {
    id,
    name: raw.startsWith('http') ? 'Imported Mix' : raw || 'My Playlist',
    tracks: found.slice(0, 20),
    createdAt: Date.now()
  };
}
