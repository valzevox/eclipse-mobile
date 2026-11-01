// TypeScript / src/components/LyricsView.tsx / Expo React Native / AMLL Word-by-Word & Romanized Synced Lyrics

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';

export function LyricsView() {
  const {
    lyrics,
    position,
    lyricsOffset,
    wordSyncEnabled,
    romanizeEnabled,
    translateEnabled,
    seekTo,
    adjustLyricsOffset,
    toggleWordSync,
    toggleRomanize,
    toggleTranslate,
    lyricsSource,
    setLyricsSource
  } = usePlayerStore();

  const effectiveTime = position - lyricsOffset;

  const activeIndex = useMemo(() => {
    if (!lyrics.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (effectiveTime >= lyrics[i].time) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, effectiveTime]);

  const cycleSource = () => {
    const order: ('lrclib' | 'netease' | 'kugou' | 'zingmp3')[] = ['lrclib', 'netease', 'kugou', 'zingmp3'];
    const next = order[(order.indexOf(lyricsSource) + 1) % order.length];
    setLyricsSource(next);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.toolbar}>
        <View style={styles.offsetGroup}>
          <TouchableOpacity onPress={() => adjustLyricsOffset(-0.2)} style={styles.pillBtn}>
            <Text style={styles.pillText}>-0.2s</Text>
          </TouchableOpacity>
          <Text style={styles.offsetVal}>{lyricsOffset.toFixed(1)}s</Text>
          <TouchableOpacity onPress={() => adjustLyricsOffset(0.2)} style={styles.pillBtn}>
            <Text style={styles.pillText}>+0.2s</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={cycleSource} style={styles.sourceBtn}>
          <Text style={styles.sourceText}>{lyricsSource.toUpperCase()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleWordSync}
          style={[styles.modeBtn, wordSyncEnabled && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, wordSyncEnabled && styles.modeTextActive]}>Word</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleRomanize}
          style={[styles.modeBtn, romanizeEnabled && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, romanizeEnabled && styles.modeTextActive]}>Romaji</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTranslate}
          style={[styles.modeBtn, translateEnabled && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, translateEnabled && styles.modeTextActive]}>文A</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {lyrics.length === 0 ? (
          <Text style={styles.empty}>Searching synchronized lyrics...</Text>
        ) : (
          lyrics.map((line, i) => {
            const isActive = i === activeIndex;
            const distance = Math.abs(i - activeIndex);
            const opacity = isActive ? 1 : Math.max(0.22, 0.65 - distance * 0.12);

            return (
              <TouchableOpacity
                key={`${line.time}_${i}`}
                onPress={() => seekTo(line.time)}
                style={[styles.lineRow, { opacity }]}
              >
                {isActive && wordSyncEnabled && line.words && line.words.length > 0 ? (
                  <Text style={[styles.lineText, styles.activeLineText]}>
                    {line.words.map((w, wi) => {
                      const sung = effectiveTime >= w.start;
                      return (
                        <Text
                          key={wi}
                          style={{ color: sung ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }}
                        >
                          {w.text}
                        </Text>
                      );
                    })}
                  </Text>
                ) : (
                  <Text style={[styles.lineText, isActive && styles.activeLineText]}>{line.text}</Text>
                )}

                {romanizeEnabled && line.romanized ? (
                  <Text style={[styles.subText, isActive && styles.activeSubText]}>{line.romanized}</Text>
                ) : null}

                {translateEnabled && line.translation ? (
                  <Text style={[styles.transText, isActive && styles.activeSubText]}>{line.translation}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    gap: 6
  },
  offsetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pillBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  pillText: { color: '#E4E4E7', fontSize: 11, fontWeight: '600' },
  offsetVal: { color: '#A1A1AA', fontSize: 11, minWidth: 28, textAlign: 'center' },
  sourceBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(182, 157, 248, 0.2)'
  },
  sourceText: { color: '#B69DF8', fontSize: 11, fontWeight: '700' },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  modeBtnActive: {
    backgroundColor: '#B69DF8'
  },
  modeText: { color: '#D4D4D8', fontSize: 11, fontWeight: '600' },
  modeTextActive: { color: '#09090B', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 28, gap: 18 },
  empty: { color: '#71717A', textAlign: 'center', marginTop: 40, fontSize: 15 },
  lineRow: { paddingVertical: 4 },
  lineText: {
    color: '#E4E4E7',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28
  },
  activeLineText: {
    color: '#FFFFFF',
    fontSize: 23
  },
  subText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3
  },
  transText: {
    color: '#B69DF8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2
  },
  activeSubText: {
    color: '#E4E4E7'
  }
});
