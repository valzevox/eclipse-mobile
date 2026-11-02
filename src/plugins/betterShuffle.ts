// TypeScript / src/plugins/betterShuffle.ts / Expo React Native / Spotify-Style & Smart Shuffle Engine (Ported from Riff-Muriel plugin/better-shuffle.js)

import { TrackItem } from '../services/innertube';
import { normalizeSearch } from '../services/libraryTools';

export type ShuffleMode = 'off' | 'classic' | 'spotify' | 'smart';

function artistKey(t: TrackItem): string {
  return normalizeSearch(t?.artist || 'unknown');
}

function fisherYates<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tránh 2 bài cùng ca sĩ nằm sát nhau
 */
export function fixAdjacentArtists(list: TrackItem[], prevArtistKey = ''): TrackItem[] {
  const a = list.slice();
  const isBad = (i: number): boolean => {
    const k = artistKey(a[i]);
    const before = i === 0 ? prevArtistKey : artistKey(a[i - 1]);
    const after = i + 1 < a.length ? artistKey(a[i + 1]) : null;
    return k === before || k === after;
  };

  for (let i = 0; i < a.length; i++) {
    const before = i === 0 ? prevArtistKey : artistKey(a[i - 1]);
    if (artistKey(a[i]) !== before) continue;
    for (let j = i + 1; j < a.length; j++) {
      [a[i], a[j]] = [a[j], a[i]];
      if (!isBad(i) && !isBad(j)) break;
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

/**
 * Spotify-style Distributed Shuffle:
 * Gom nhóm theo nghệ sĩ, rải đều bài hát của cùng 1 nghệ sĩ trên toàn danh sách thay vì bị dồn cục
 */
export function arrangeSpotifyShuffle(tracks: TrackItem[], currentTrack?: TrackItem | null): TrackItem[] {
  if (!Array.isArray(tracks) || tracks.length <= 1) return tracks.slice();
  const rest = currentTrack ? tracks.filter((t) => t.id !== currentTrack.id) : tracks.slice();
  const groups = new Map<string, TrackItem[]>();

  for (const t of rest) {
    const k = artistKey(t);
    const list = groups.get(k) || [];
    list.push(t);
    groups.set(k, list);
  }

  const scored: { t: TrackItem; pos: number }[] = [];
  groups.forEach((g) => {
    const s = fisherYates(g);
    s.forEach((t, i) => {
      scored.push({ t, pos: (i + Math.random()) / s.length });
    });
  });

  scored.sort((x, y) => x.pos - y.pos);
  const prevKey = currentTrack ? artistKey(currentTrack) : '';
  const distributed = fixAdjacentArtists(
    scored.map((x) => x.t),
    prevKey
  );

  return currentTrack ? [currentTrack, ...distributed] : distributed;
}

/**
 * Chọn bài tiếp theo theo chế độ Shuffle:
 * - classic: ngẫu nhiên đơn thuần
 * - spotify / smart: ưu tiên nghệ sĩ khác bài vừa phát + ưu tiên bài yêu thích
 */
export function pickNextShuffledTrack(
  queue: TrackItem[],
  currentTrack: TrackItem,
  favorites: TrackItem[] = [],
  mode: ShuffleMode = 'spotify'
): TrackItem {
  const candidates = queue.filter((t) => t.id !== currentTrack.id);
  if (candidates.length === 0) return currentTrack;
  if (mode === 'classic') {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const curArtist = artistKey(currentTrack);
  const diffArtistCandidates = candidates.filter((t) => artistKey(t) !== curArtist);
  const pool = diffArtistCandidates.length > 0 ? diffArtistCandidates : candidates;

  if (mode === 'smart' && favorites.length > 0) {
    const favArtists = new Set(favorites.map(artistKey));
    let best = pool[0];
    let bestScore = -Infinity;
    for (const c of pool) {
      const bonus = favArtists.has(artistKey(c)) ? 1.5 : 0;
      const score = bonus + Math.random() * 2;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
