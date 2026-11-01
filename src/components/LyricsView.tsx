// TypeScript / src/components/LyricsView.tsx / Expo React Native / AMLL Auto-Scrolling Word-by-Word & Romanized Synced Lyrics

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchSyncedLyrics, enrichLyricsWithTranslationAndRomaji } from '../services/lyrics';

export function LyricsView() {
  const {
    lyrics,
    position,
    lyricsOffset,
    wordSyncEnabled,
    romanizeEnabled,
    translateEnabled,
    translationLang,
    accentColor,
    seekTo,
    adjustLyricsOffset,
    toggleWordSync,
    toggleRomanize,
    toggleTranslate,
    lyricsSource,
    setLyricsSource,
    setCustomLyrics
  } = usePlayerStore();

  const scrollRef = useRef<ScrollView>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
      const targetY = Math.max(0, activeIndex * 64 - 110);
      scrollRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [activeIndex]);

  const cycleSource = () => {
    const order: ('lrclib' | 'netease' | 'kugou' | 'zingmp3' | 'musixmatch')[] = [
      'lrclib',
      'netease',
      'kugou',
      'zingmp3',
      'musixmatch'
    ];
    const next = order[(order.indexOf(lyricsSource) + 1) % order.length];
    setLyricsSource(next);
  };

  const runCustomLyricSearch = async () => {
    if (!customQuery.trim() || searching) return;
    setSearching(true);
    const parts = customQuery.split('-').map((s) => s.trim());
    const title = parts[0] || customQuery.trim();
    const artist = parts[1] || '';
    const rawLines = await fetchSyncedLyrics(title, artist, 0, lyricsSource);
    const enriched = await enrichLyricsWithTranslationAndRomaji(
      rawLines,
      romanizeEnabled,
      translateEnabled ? translationLang : null
    );
    setCustomLyrics(enriched);
    setSearching(false);
    setShowSearch(false);
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
          <Text style={[styles.sourceText, { color: accentColor }]}>{lyricsSource.toUpperCase()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleWordSync}
          style={[styles.modeBtn, wordSyncEnabled && { backgroundColor: accentColor }]}
        >
          <Text style={[styles.modeText, wordSyncEnabled && styles.modeTextActive]}>Word</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleRomanize}
          style={[styles.modeBtn, romanizeEnabled && { backgroundColor: accentColor }]}
        >
          <Text style={[styles.modeText, romanizeEnabled && styles.modeTextActive]}>Romaji</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTranslate}
          style={[styles.modeBtn, translateEnabled && { backgroundColor: accentColor }]}
        >
          <Text style={[styles.modeText, translateEnabled && styles.modeTextActive]}>文A</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.pillBtn}>
          <Search size={13} color="#E4E4E7" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Song Title - Artist..."
            placeholderTextColor="#71717A"
            value={customQuery}
            onChangeText={setCustomQuery}
            onSubmitEditing={runCustomLyricSearch}
          />
          <TouchableOpacity
            onPress={runCustomLyricSearch}
            style={[styles.searchGoBtn, { backgroundColor: accentColor }]}
          >
            <Text style={styles.modeTextActive}>{searching ? '...' : 'Find'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
                          style={{ color: sung ? accentColor : 'rgba(255,255,255,0.45)' }}
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
                  <Text style={[styles.transText, { color: accentColor }, isActive && styles.activeSubText]}>
                    {line.translation}
                  </Text>
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
    marginBottom: 10,
    gap: 5
  },
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#18181F',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 36,
    fontSize: 13
  },
  searchGoBtn: {
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  offsetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pillBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  pillText: { color: '#E4E4E7', fontSize: 11, fontWeight: '600' },
  offsetVal: { color: '#A1A1AA', fontSize: 11, minWidth: 26, textAlign: 'center' },
  sourceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(182, 157, 248, 0.15)'
  },
  sourceText: { fontSize: 11, fontWeight: '700' },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  modeText: { color: '#D4D4D8', fontSize: 11, fontWeight: '600' },
  modeTextActive: { color: '#09090B', fontWeight: '700', fontSize: 11 },
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
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2
  },
  activeSubText: {
    color: '#E4E4E7'
  }
});
