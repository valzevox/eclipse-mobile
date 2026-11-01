// TypeScript / src/services/romanize.ts / Expo React Native / CJK Romanization & Translation

const NON_LATIN_SCRIPT_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f\u0400-\u04ff]/;

export function hasNonLatinScript(text: string): boolean {
  if (!text || !text.trim()) return false;
  return NON_LATIN_SCRIPT_RE.test(text);
}

export function normalizeCompareText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

export async function romanizeLyricsLines(lines: string[]): Promise<string[]> {
  const results: string[] = new Array(lines.length).fill('');
  const indicesToFetch: number[] = [];
  const textsToFetch: string[] = [];

  lines.forEach((line, idx) => {
    const trimmed = (line || '').trim();
    if (trimmed && hasNonLatinScript(trimmed)) {
      indicesToFetch.push(idx);
      textsToFetch.push(trimmed);
    }
  });

  if (textsToFetch.length === 0) return results;

  try {
    const batchPromises = textsToFetch.map(async (line) => {
      const url =
        'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=auto&tl=en&dt=t&dt=rm&q=' +
        encodeURIComponent(line);
      const res = await fetch(url);
      if (!res.ok) return '';
      const data = await res.json();
      if (data && Array.isArray(data[0])) {
        let roma = '';
        for (const seg of data[0]) {
          if (seg && seg.length >= 4 && typeof seg[3] === 'string' && seg[3].trim()) {
            roma += (roma ? ' ' : '') + seg[3].trim();
          } else if (seg && seg.length >= 3 && typeof seg[2] === 'string' && seg[2].trim()) {
            roma += (roma ? ' ' : '') + seg[2].trim();
          }
        }
        // Prevent duplicate line if romanized output is identical to source
        if (roma && normalizeCompareText(roma) !== normalizeCompareText(line)) {
          return roma;
        }
      }
      return '';
    });

    const resolved = await Promise.all(batchPromises);
    resolved.forEach((roma, i) => {
      results[indicesToFetch[i]] = roma;
    });
  } catch (_) {
    // Fallback gracefully on offline/network error
  }

  return results;
}

export async function translateLyricsLines(
  lines: string[],
  targetLang: string
): Promise<string[]> {
  if (!lines.length) return [];
  if (targetLang === 'romaji') {
    return romanizeLyricsLines(lines);
  }

  const nonEmptyIndices: number[] = [];
  const nonEmptyTexts: string[] = [];
  lines.forEach((l, idx) => {
    if (l && l.trim()) {
      nonEmptyIndices.push(idx);
      nonEmptyTexts.push(l.trim());
    }
  });

  const out = new Array(lines.length).fill('');
  if (!nonEmptyTexts.length) return out;

  try {
    const joined = nonEmptyTexts.join('\n');
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLang
      )}&dt=t&q=` + encodeURIComponent(joined);
    const res = await fetch(url);
    if (!res.ok) return out;
    const data = await res.json();
    if (data && Array.isArray(data[0])) {
      const translatedJoined = data[0].map((s: any) => s[0] || '').join('');
      const splitLines = translatedJoined.split('\n');
      nonEmptyIndices.forEach((origIdx, i) => {
        const candidate = (splitLines[i] || '').trim();
        const orig = lines[origIdx].trim();
        if (candidate && normalizeCompareText(candidate) !== normalizeCompareText(orig)) {
          out[origIdx] = candidate;
        }
      });
    }
  } catch (_) {}

  return out;
}
