// TypeScript / src/services/libraryTools.ts / Expo React Native / Track Deduplication, Sorting, Diacritic-Free Search & RTL Lyrics Detection (Ported from Riff-Muriel)

import { TrackItem } from './innertube';

export type TrackSortMode = 'manual' | 'added-desc' | 'added-asc' | 'title-asc' | 'artist-asc';

const RTL_CHAR_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LETTER_RE = /\p{L}/u;

/**
 * Chuẩn hóa chuỗi tìm kiếm (bỏ dấu tiếng Việt, Arabic/Persian/Hebrew diacritics, chữ thường)
 * Ported từ `search-text.js` của Riff-Muriel
 */
export function normalizeSearch(value: string): string {
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

/**
 * Kiểm tra xem một bài hát có khớp với từ khóa tìm kiếm cục bộ không
 */
export function matchesSearchQuery(track: TrackItem, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const hay = normalizeSearch(`${track.title} ${track.artist} ${track.album || ''}`);
  return hay.includes(q);
}

/**
 * Khử trùng lặp danh sách bài hát theo ID hoặc (Title + Artist)
 * Ported từ `library-tools.js` của Riff-Muriel
 */
export function dedupeTracks(tracks: TrackItem[]): TrackItem[] {
  if (!Array.isArray(tracks)) return [];
  const kept: TrackItem[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const track of tracks) {
    if (!track) continue;
    const idKey = `${track.platform || 'ytmusic'}:${track.id}`;
    const looseKey = `${normalizeSearch(track.title)}::${normalizeSearch(track.artist)}`;
    if (seenIds.has(idKey) || seenKeys.has(looseKey)) continue;
    seenIds.add(idKey);
    seenKeys.add(looseKey);
    kept.push(track);
  }
  return kept;
}

/**
 * Sắp xếp danh sách bài hát theo chế độ
 * Ported từ `src/renderer/track-sort.js` của Riff-Muriel
 */
export function sortTracks(tracks: (TrackItem & { addedAt?: number })[], mode: TrackSortMode): TrackItem[] {
  const list = Array.isArray(tracks) ? tracks.slice() : [];
  if (mode === 'manual') return list;
  if (mode === 'title-asc') {
    return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  if (mode === 'artist-asc') {
    return list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  }
  const dir = mode === 'added-desc' ? -1 : 1;
  return list.sort((a, b) => {
    const at = typeof a.addedAt === 'number' ? a.addedAt : 0;
    const bt = typeof b.addedAt === 'number' ? b.addedAt : 0;
    if (at === bt) return 0;
    return at < bt ? -dir : dir;
  });
}

/**
 * Nhận diện văn bản RTL (Right-To-Left: Arabic, Hebrew, Persian, Urdu)
 * Ported từ `src/renderer/lyrics-rtl.js` của Riff-Muriel
 */
export function isRtlText(text: string): boolean {
  const clean = String(text || '').replace(/<[^>]*>/g, '');
  for (const ch of clean) {
    if (!LETTER_RE.test(ch)) continue;
    return RTL_CHAR_RE.test(ch);
  }
  return RTL_CHAR_RE.test(clean);
}
