// TypeScript / src/services/lyrics.ts / Expo React Native / Multi-Source Synced Lyrics & Word-by-Word YRC/LRC

import { romanizeLyricsLines, translateLyricsLines } from './romanize';

export type LyricsSource = 'lrclib' | 'netease' | 'kugou' | 'zingmp3';

export interface LyricWord {
  text: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface LyricLine {
  time: number; // seconds
  text: string;
  words?: LyricWord[];
  romanized?: string;
  translation?: string;
}

function decodeBase64Utf8(b64: string): string {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = b64.replace(/=+$/, '');
    let output = '';
    for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
      buffer = chars.indexOf(buffer);
    }
    return decodeURIComponent(
      output
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (_) {
    return '';
  }
}

export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split(/\r?\n/);
  const out: LyricLine[] = [];
  const timeExp = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const raw of lines) {
    const matches = [...raw.matchAll(timeExp)];
    if (!matches.length) continue;
    const content = raw.replace(timeExp, '').trim();
    if (!content) continue;

    const wordMatches = [...content.matchAll(/<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>([^<]+)/g)];
    let words: LyricWord[] | undefined;
    let plainText = content;

    if (wordMatches.length > 0) {
      words = [];
      plainText = '';
      for (let i = 0; i < wordMatches.length; i++) {
        const m = wordMatches[i];
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
        const start = min * 60 + sec + ms / 1000;
        const wText = m[4];
        plainText += wText;
        words.push({
          text: wText,
          start,
          end: start + 0.35
        });
      }
      for (let i = 0; i < words.length - 1; i++) {
        words[i].end = words[i + 1].start;
      }
    }

    for (const m of matches) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
      const time = min * 60 + sec + ms / 1000;
      out.push({ time, text: plainText.trim(), words });
    }
  }

  return out.sort((a, b) => a.time - b.time);
}

export function parseNetEaseYrc(yrcText: string): LyricLine[] {
  if (!yrcText || typeof yrcText !== 'string') return [];
  const out: LyricLine[] = [];
  const lines = yrcText.split(/\r?\n/);

  for (const line of lines) {
    const lineMatch = line.match(/^\[(\d+),(\d+)\](.*)$/);
    if (!lineMatch) continue;
    const lineStart = parseInt(lineMatch[1], 10) / 1000;
    const body = lineMatch[3];
    const words: LyricWord[] = [];
    let fullText = '';

    const wordReg = /\((\d+),(\d+),\d+\)([^\(]*)/g;
    let wm: RegExpExecArray | null;
    while ((wm = wordReg.exec(body)) !== null) {
      const wStart = parseInt(wm[1], 10) / 1000;
      const wDur = parseInt(wm[2], 10) / 1000;
      const wText = wm[3];
      fullText += wText;
      words.push({
        text: wText,
        start: wStart,
        end: wStart + wDur
      });
    }

    if (fullText.trim()) {
      out.push({
        time: lineStart,
        text: fullText.trim(),
        words: words.length > 0 ? words : undefined
      });
    }
  }

  return out.sort((a, b) => a.time - b.time);
}

async function fetchFromLrcLib(cleanTitle: string, cleanArtist: string): Promise<LyricLine[]> {
  try {
    const q = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    const res = await fetch(`https://lrclib.net/api/search?q=${q}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        const withSynced = list.filter((item: any) => item.syncedLyrics);
        const chosen = withSynced[0] || list[0];
        if (chosen && chosen.syncedLyrics) {
          return parseLrc(chosen.syncedLyrics);
        }
      }
    }
  } catch (_) {}
  return [];
}

async function fetchFromNetEase(cleanTitle: string, cleanArtist: string, duration?: number): Promise<LyricLine[]> {
  try {
    const q = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);
    const sRes = await fetch(`https://music.163.com/api/search/get/web?s=${q}&type=1&limit=5`, {
      headers: { Referer: 'https://music.163.com' }
    });
    if (!sRes.ok) return [];
    const sJson = await sRes.json();
    const songs = sJson?.result?.songs;
    if (!Array.isArray(songs) || !songs.length) return [];

    const chosen =
      songs.find((s: any) => {
        if (duration && duration > 0 && s.duration) {
          return Math.abs(s.duration / 1000 - duration) <= 6;
        }
        return true;
      }) || songs[0];

    if (!chosen?.id) return [];
    const lRes = await fetch(`https://music.163.com/api/song/lyric?id=${chosen.id}&lv=1&kv=1&tv=-1&yv=1`, {
      headers: { Referer: 'https://music.163.com' }
    });
    if (!lRes.ok) return [];
    const lJson = await lRes.json();

    if (lJson?.yrc?.lyric) {
      const yrcLines = parseNetEaseYrc(lJson.yrc.lyric);
      if (yrcLines.length > 0) return yrcLines;
    }
    if (lJson?.lrc?.lyric) {
      const lrcLines = parseLrc(lJson.lrc.lyric);
      if (lrcLines.length > 0) return lrcLines;
    }
  } catch (_) {}
  return [];
}

async function fetchFromKuGou(cleanTitle: string, cleanArtist: string, duration?: number): Promise<LyricLine[]> {
  try {
    const durMs = Math.round((duration || 200) * 1000);
    const kw = encodeURIComponent(`${cleanArtist} - ${cleanTitle}`);
    const sRes = await fetch(`https://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${kw}&duration=${durMs}&hash=`);
    if (!sRes.ok) return [];
    const sJson = await sRes.json();
    const cand = sJson?.candidates?.[0];
    if (!cand?.id || !cand?.accesskey) return [];

    const dRes = await fetch(
      `https://lyrics.kugou.com/download?ver=1&client=pc&id=${cand.id}&accesskey=${cand.accesskey}&fmt=lrc&charset=utf8`
    );
    if (!dRes.ok) return [];
    const dJson = await dRes.json();
    if (!dJson?.content) return [];
    const decoded = decodeBase64Utf8(dJson.content);
    if (decoded) {
      return parseLrc(decoded);
    }
  } catch (_) {}
  return [];
}

export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  duration?: number,
  source: LyricsSource = 'lrclib'
): Promise<LyricLine[]> {
  const cleanTitle = (title || '').replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, '').trim();
  const cleanArtist = (artist || '').replace(/\s*-\s*Topic$/i, '').trim();

  if (source === 'netease') {
    const ne = await fetchFromNetEase(cleanTitle, cleanArtist, duration);
    if (ne.length > 0) return ne;
  } else if (source === 'kugou') {
    const kg = await fetchFromKuGou(cleanTitle, cleanArtist, duration);
    if (kg.length > 0) return kg;
  }

  // Priority fallback chain (NetEase YRC word-sync -> LRCLIB -> KuGou)
  const lrc = await fetchFromLrcLib(cleanTitle, cleanArtist);
  if (lrc.length > 0) {
    // If wordSync is desired and LRCLIB has no word timestamps, try enriching from NetEase YRC
    if (!lrc.some((l) => l.words && l.words.length > 0)) {
      const ne = await fetchFromNetEase(cleanTitle, cleanArtist, duration);
      if (ne.some((l) => l.words && l.words.length > 0)) return ne;
    }
    return lrc;
  }

  const neFallback = await fetchFromNetEase(cleanTitle, cleanArtist, duration);
  if (neFallback.length > 0) return neFallback;

  const kgFallback = await fetchFromKuGou(cleanTitle, cleanArtist, duration);
  if (kgFallback.length > 0) return kgFallback;

  return [];
}

export async function enrichLyricsWithTranslationAndRomaji(
  lines: LyricLine[],
  enableRomanize: boolean,
  translateTo: string | null
): Promise<LyricLine[]> {
  if (!lines.length) return lines;
  const rawTexts = lines.map((l) => l.text);

  const [romajiList, transList] = await Promise.all([
    enableRomanize ? romanizeLyricsLines(rawTexts) : Promise.resolve(new Array(lines.length).fill('')),
    translateTo ? translateLyricsLines(rawTexts, translateTo) : Promise.resolve(new Array(lines.length).fill(''))
  ]);

  return lines.map((line, i) => ({
    ...line,
    romanized: romajiList[i] || undefined,
    translation: transList[i] || undefined
  }));
}
