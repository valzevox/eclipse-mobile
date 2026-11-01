// TypeScript / src/services/sponsorblock.ts / Expo React Native / SponsorBlock Silence & Intro/Outro Auto-Skip

export interface SkipSegment {
  category: string;
  start: number;
  end: number;
}

const segmentCache = new Map<string, SkipSegment[]>();

export async function fetchSponsorSegments(videoId: string): Promise<SkipSegment[]> {
  if (!videoId || videoId.startsWith('sc_') || videoId.startsWith('local_') || videoId.startsWith('sp_')) {
    return [];
  }
  if (segmentCache.has(videoId)) {
    return segmentCache.get(videoId) || [];
  }
  try {
    const categories = encodeURIComponent(
      JSON.stringify(['sponsor', 'intro', 'outro', 'selfpromo', 'music_offtopic'])
    );
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}&categories=${categories}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Eclipse-Mobile/1.0' }
    });
    if (!res.ok) {
      segmentCache.set(videoId, []);
      return [];
    }
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    const segments: SkipSegment[] = list
      .map((item: any) => ({
        category: String(item.category || 'music_offtopic'),
        start: Number(item.segment?.[0] ?? 0),
        end: Number(item.segment?.[1] ?? 0)
      }))
      .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start);
    if (segmentCache.size > 100) segmentCache.clear();
    segmentCache.set(videoId, segments);
    return segments;
  } catch (_) {
    return [];
  }
}
