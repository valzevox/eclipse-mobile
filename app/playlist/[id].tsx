// TypeScript / app/playlist/[id].tsx / Expo React Native / Playlist Detail View with Sort, Filter & Dedupe (Ported from Riff-Muriel)

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Play, ArrowUpDown, Sparkles, Search } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { sortTracks, dedupeTracks, matchesSearchQuery, TrackSortMode } from '../../src/services/libraryTools';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playlists, playTrack, accentColor } = usePlayerStore();
  const playlist = playlists.find((p) => p.id === id);
  const [filterText, setFilterText] = useState('');
  const [sortMode, setSortMode] = useState<TrackSortMode>('manual');
  const [dedupedOnly, setDedupedOnly] = useState(false);

  const processedTracks = useMemo(() => {
    if (!playlist) return [];
    let list = dedupedOnly ? dedupeTracks(playlist.tracks) : playlist.tracks;
    if (filterText.trim()) {
      list = list.filter((t) => matchesSearchQuery(t, filterText));
    }
    return sortTracks(list, sortMode);
  }, [playlist, filterText, sortMode, dedupedOnly]);

  const cycleSort = () => {
    const modes: TrackSortMode[] = ['manual', 'title-asc', 'artist-asc'];
    setSortMode(modes[(modes.indexOf(sortMode) + 1) % modes.length]);
  };

  if (!playlist) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playlist not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={styles.subTitle}>{playlist.tracks.length} tracks</Text>
        </View>
        <TouchableOpacity
          style={[styles.playAllBtn, { backgroundColor: accentColor }]}
          onPress={() => processedTracks[0] && playTrack(processedTracks[0], processedTracks)}
        >
          <Play size={18} color="#09090B" fill="#09090B" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolsRow}>
        <View style={styles.filterBox}>
          <Search size={14} color="#71717A" />
          <TextInput
            style={styles.filterInput}
            placeholder="Filter in playlist..."
            placeholderTextColor="#71717A"
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>
        <TouchableOpacity onPress={cycleSort} style={styles.toolBtn}>
          <ArrowUpDown size={14} color={accentColor} />
          <Text style={[styles.toolBtnText, { color: accentColor }]}>{sortMode}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDedupedOnly(!dedupedOnly)}
          style={[styles.toolBtn, dedupedOnly && { backgroundColor: `${accentColor}22` }]}
        >
          <Sparkles size={14} color={dedupedOnly ? accentColor : '#A1A1AA'} />
          <Text style={[styles.toolBtnText, dedupedOnly && { color: accentColor }]}>Dedupe</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={processedTracks}
        keyExtractor={(item, idx) => `${item.id}_${idx}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => playTrack(item, processedTracks)}>
            <Image source={{ uri: item.thumbnail }} style={styles.art} />
            <View style={styles.meta}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <Play size={18} color="#B69DF8" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12
  },
  backBtn: { padding: 6 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  subTitle: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  playAllBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B69DF8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 4
  },
  filterBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 36,
    gap: 6
  },
  filterInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141418',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 12
  },
  toolBtnText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600'
  },
  list: { padding: 18, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    padding: 10,
    borderRadius: 14,
    gap: 12
  },
  art: { width: 48, height: 48, borderRadius: 10 },
  meta: { flex: 1 },
  trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  trackArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 }
});
