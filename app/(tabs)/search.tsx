// TypeScript / app/(tabs)/search.tsx / Expo React Native / Glassmorphic Multi-Source Search Screen with Instant WEB_REMIX Innertube

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
    try {
      const items = await searchTracks(q, p);
      setResults(items);
    } finally {
      setLoading(false);
    }
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

        <View style={[styles.searchBox, { borderColor: `${accentColor}38` }]}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
          <SearchIcon size={18} color={accentColor} />
          <TextInput
            style={styles.input}
            placeholder={tr(uiLang, 'searchPlaceholder')}
            placeholderTextColor="#A1A1AA"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
              }}
              style={styles.clearIconBtn}
            >
              <X size={18} color="#A1A1AA" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.goBtn, { backgroundColor: accentColor }]}
            onPress={() => runSearch()}
          >
            <Text style={styles.goBtnText}>Go</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chips}>
          {platforms.map((p) => {
            const active = platform === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => {
                  setPlatform(p.key);
                  if (query.trim()) runSearch(query, p.key);
                }}
                style={[
                  styles.chip,
                  active && { backgroundColor: accentColor, borderColor: accentColor }
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
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
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.loadingText}>Searching direct Innertube stream...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.id}_${idx}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => playTrack(item, results)}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.art} />
                <View style={styles.meta}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
                <View style={[styles.playBadge, { backgroundColor: `${accentColor}22` }]}>
                  <Play size={16} color={accentColor} fill={accentColor} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, padding: 18 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 14, letterSpacing: -0.6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '500' },
  clearIconBtn: { padding: 4 },
  goBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14
  },
  goBtnText: { color: '#09090B', fontSize: 13, fontWeight: '800' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)'
  },
  chipText: { color: '#D4D4D8', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#09090B', fontWeight: '800' },
  genresSection: { marginTop: 8 },
  genreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  genreTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)'
  },
  genreText: { color: '#F4F4F5', fontSize: 13, fontWeight: '600' },
  loadingWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  loadingText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  list: { gap: 10, paddingBottom: 140 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  art: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#27272A' },
  meta: { flex: 1 },
  trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  trackArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  playBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
