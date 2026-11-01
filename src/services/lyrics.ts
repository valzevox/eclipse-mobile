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

    // Check inline word-level timestamps e.g. <00:12.34>word
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

export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  duration?: number,
  source: LyricsSource = 'lrclib'
): Promise<LyricLine[]> {
  const cleanTitle = title.replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, '').trim();
  const cleanArtist = artist.replace(/\s*-\s*Topic$/i, '').trim();

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
