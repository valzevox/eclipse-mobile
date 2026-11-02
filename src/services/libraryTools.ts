// TypeScript / src/services/libraryTools.ts / Expo React Native / Track Deduplication, Sorting, Diacritic-Free Search & RTL Lyrics Detection

import { TrackItem } from './innertube';

export type TrackSortMode = 'manual' | 'added-desc' | 'added-asc' | 'title-asc' | 'artist-asc' | 'duration-asc';

export const TRACK_SORT_MODES: TrackSortMode[] = [
  'manual',
  'added-desc',
  'added-asc',
  'title-asc',
  'artist-asc',
  'duration-asc'
];

const RTL_CHAR_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LETTER_RE = /\p{L}/u;

export function normalizeSearch(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u0591-\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/\u0640/g, '')
    .replace(/[\u06cc\u0649]/g, '\u064a')
    .replace(/\u06a9/g, '\u0643')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u06c1/g, '\u0647')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSearchQuery(track: TrackItem, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const hay = normalizeSearch(`${track.title} ${track.artist} ${track.album || ''}`);
  return hay.includes(q);
}

export function dedupeTracks<T extends Partial<TrackItem>>(
  tracks: T[],
  same?: (a: T, b: T) => boolean
): T[] {
  if (!Array.isArray(tracks)) return [];
  if (typeof same === 'function') {
    const kept: T[] = [];
    for (const track of tracks) {
      if (!kept.some((other) => same(other, track))) kept.push(track);
    }
    return kept;
  }

  const kept: T[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const track of tracks) {
    if (!track) continue;
    const idKey = `${track.platform || 'ytmusic'}:${track.id || ''}`;
    const looseKey = `${normalizeSearch(track.title)}::${normalizeSearch(track.artist)}`;
    if ((track.id && seenIds.has(idKey)) || (track.title && seenKeys.has(looseKey))) continue;
    if (track.id) seenIds.add(idKey);
    if (track.title) seenKeys.add(looseKey);
    kept.push(track);
  }
  return kept;
}

export function backfillAddedAt<T extends { addedAt?: number }>(tracks: T[], newestFirst: boolean): T[] {
  if (!Array.isArray(tracks)) return tracks;
  const now = Date.now();
  let changed = false;
  const list = tracks.map((t, i) => {
    if (!t || typeof t.addedAt === 'number') return t;
    changed = true;
    return { ...t, addedAt: now - (newestFirst ? i : tracks.length - i) * 1000 };
  });
  return changed ? list : tracks;
}

export function sortTracks<T extends Partial<TrackItem> & { addedAt?: number }>(
  tracks: T[],
  mode: TrackSortMode
): T[] {
  const list = Array.isArray(tracks) ? tracks.slice() : [];
  if (mode === 'manual') return list;

  if (mode === 'title-asc') {
    return list.sort((a, b) => {
      const ta = String(a?.title || '').trim().toLowerCase();
      const tb = String(b?.title || '').trim().toLowerCase();
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta.localeCompare(tb);
    });
  }

  if (mode === 'artist-asc') {
    return list.sort((a, b) => {
      const aa = String(a?.artist || '').trim().toLowerCase();
      const ab = String(b?.artist || '').trim().toLowerCase();
      if (!aa && !ab) return 0;
      if (!aa) return 1;
      if (!ab) return -1;
      return aa.localeCompare(ab);
    });
  }

  if (mode === 'duration-asc') {
    return list.sort((a, b) => {
      const da = typeof a?.duration === 'number' && a.duration > 0 ? a.duration : Infinity;
      const db = typeof b?.duration === 'number' && b.duration > 0 ? b.duration : Infinity;
      if (da === db) return 0;
      return da < db ? -1 : 1;
    });
  }

  if (mode === 'added-desc' || mode === 'added-asc') {
    const dir = mode === 'added-desc' ? -1 : 1;
    return list.sort((a, b) => {
      const at = a && typeof a.addedAt === 'number' ? a.addedAt : 0;
      const bt = b && typeof b.addedAt === 'number' ? b.addedAt : 0;
      if (at === bt) return 0;
      return at < bt ? -dir : dir;
    });
  }

  return list;
}

export function isRtlLanguageCode(lang: string): boolean {
  return /^(ar|fa|per|fas|prs|pes|he|iw|ur|ps|ckb|sd|ug|yi)\b/i.test(String(lang || '').trim());
}

export function isRtlText(text: string): boolean {
  const clean = String(text || '').replace(/<[^>]*>/g, '');
  for (const ch of clean) {
    if (!LETTER_RE.test(ch)) continue;
    return RTL_CHAR_RE.test(ch);
  }
  return RTL_CHAR_RE.test(clean);
}
