// TypeScript / src/services/soundcloud.ts / Expo React Native / SoundCloud Search & Stream Resolver

import { TrackItem } from './innertube';

const SC_CLIENT_IDS = [
  'iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX',
  'a3e059563d7fd3372b49b37f00a00bcf'
];

export async function searchSoundCloud(query: string): Promise<TrackItem[]> {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());

  for (const cid of SC_CLIENT_IDS) {
    try {
      const url = `https://api-v2.soundcloud.com/search/tracks?q=${q}&client_id=${cid}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.collection) && data.collection.length > 0) {
        return data.collection.map((item: any) => {
          const progressive = item.media?.transcodings?.find(
            (t: any) => t.format?.protocol === 'progressive'
          );
          return {
            id: `sc_${item.id}`,
            title: item.title || 'SoundCloud Track',
            artist: item.user?.username || 'Unknown Artist',
            duration: Math.round((item.duration || 180000) / 1000),
            thumbnail:
              (item.artwork_url || item.user?.avatar_url || '').replace('-large', '-t500x500') ||
              'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg',
            platform: 'soundcloud' as const,
            streamUrl: progressive?.url ? `${progressive.url}?client_id=${cid}` : undefined
          };
        });
      }
    } catch (_) {}
  }

  return [];
}

export async function resolveSoundCloudStream(apiTranscodingUrl: string): Promise<string | null> {
  if (!apiTranscodingUrl) return null;
  try {
    const res = await fetch(apiTranscodingUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url || null;
  } catch (_) {
    return null;
  }
}
