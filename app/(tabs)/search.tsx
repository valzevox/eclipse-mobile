// TypeScript / app/(tabs)/search.tsx / Expo React Native / Multi-Source Search Screen with Genre Chips & Dynamic Accent

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, Play, Sparkles, X } from 'lucide-react-native';
import { searchTracks, TrackItem } from '../../src/services/innertube';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { tr } from '../../src/services/i18n';

const POPULAR_GENRES = [
  'V-Pop Hits',
  'J-Pop Anime',
  'K-Pop Trending',
  'Lofi Beats',
  'Chill R&B',
  'Acoustic Pop',
  'EDM Party',
  'Rap Viet'
];

export default function SearchScreen() {
  const { playTrack, uiLang, accentColor } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<'ytmusic' | 'youtube' | 'soundcloud'>('ytmusic');
  const [results, setResults] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async (targetQuery?: string, nextPlat?: 'ytmusic' | 'youtube' | 'soundcloud') => {
    const q = targetQuery !== undefined ? targetQuery : query;
    const p = nextPlat || platform;
    if (!q.trim()) return;
    setLoading(true);
    const items = await searchTracks(q, p);
    setResults(items);
    setLoading(false);
  };

  const handleSelectGenre = (genre: string) => {
    setQuery(genre);
    runSearch(genre, platform);
  };

  const platforms: { key: 'ytmusic' | 'youtube' | 'soundcloud'; label: string }[] = [
    { key: 'ytmusic', label: 'YouTube Music' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'soundcloud', label: 'SoundCloud' }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{tr(uiLang, 'search')}</Text>

        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#A1A1AA" />
          <TextInput
            style={styles.input}
            placeholder={tr(uiLang, 'searchPlaceholder')}
            placeholderTextColor="#71717A"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <X size={18} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chips}>
          {platforms.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => {
                setPlatform(p.key);
                if (query.trim()) runSearch(query, p.key);
              }}
              style={[styles.chip, platform === p.key && { backgroundColor: accentColor }]}
            >
              <Text style={[styles.chipText, platform === p.key && styles.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {results.length === 0 && !loading && (
          <View style={styles.genresSection}>
            <View style={styles.genreHeader}>
              <Sparkles size={16} color={accentColor} />
              <Text style={styles.genreTitle}>Browse Categories</Text>
            </View>
            <View style={styles.genreGrid}>
              {POPULAR_GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.genreCard}
                  onPress={() => handleSelectGenre(g)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.genreText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.id}_${idx}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => playTrack(item, results)}>
                <Image source={{ uri: item.thumbnail }} style={styles.art} />
                <View style={styles.meta}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
                <Play size={18} color={accentColor} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1, padding: 18 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 14, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#18181B'
  },
  chipText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#09090B', fontWeight: '700' },
  genresSection: { marginTop: 8 },
  genreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  genreTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreCard: {
    backgroundColor: '#181820',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  genreText: { color: '#E4E4E7', fontSize: 13, fontWeight: '600' },
  list: { gap: 10, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    padding: 10,
    borderRadius: 14,
    gap: 12
  },
  art: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#27272A' },
  meta: { flex: 1 },
  trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  trackArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 }
});
