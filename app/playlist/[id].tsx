// TypeScript / app/playlist/[id].tsx / Expo React Native / Playlist Detail View

import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Play } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playlists, playTrack } = usePlayerStore();
  const playlist = playlists.find((p) => p.id === id);

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
          style={styles.playAllBtn}
          onPress={() => playlist.tracks[0] && playTrack(playlist.tracks[0], playlist.tracks)}
        >
          <Play size={18} color="#09090B" fill="#09090B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlist.tracks}
        keyExtractor={(item, idx) => `${item.id}_${idx}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => playTrack(item, playlist.tracks)}>
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
