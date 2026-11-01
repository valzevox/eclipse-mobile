// TypeScript / app/(tabs)/library.tsx / Expo React Native / Favorites & External Playlist Import

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, PlusCircle, Play, ListMusic } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { importExternalPlaylist } from '../../src/services/playlistImport';
import { tr } from '../../src/services/i18n';

export default function LibraryScreen() {
  const { favorites, playlists, playTrack, addPlaylist, uiLang } = usePlayerStore();
  const [importInput, setImportInput] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!importInput.trim() || importing) return;
    setImporting(true);
    const pl = await importExternalPlaylist(importInput);
    addPlaylist(pl);
    setImportInput('');
    setImporting(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{tr(uiLang, 'library')}</Text>

        <View style={styles.importCard}>
          <Text style={styles.importLabel}>{tr(uiLang, 'importPlaylist')}</Text>
          <View style={styles.importRow}>
            <TextInput
              style={styles.input}
              placeholder="Paste Spotify / YouTube Music link..."
              placeholderTextColor="#71717A"
              value={importInput}
              onChangeText={setImportInput}
            />
            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <PlusCircle size={18} color="#09090B" />
              <Text style={styles.importBtnText}>{importing ? '...' : 'Import'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Heart size={18} color="#FF4D6D" />
          <Text style={styles.sectionTitle}>
            {tr(uiLang, 'favorites')} ({favorites.length})
          </Text>
        </View>
        {favorites.map((item) => (
          <TouchableOpacity key={item.id} style={styles.row} onPress={() => playTrack(item, favorites)}>
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
        ))}

        <View style={[styles.sectionHeader, { marginTop: 22 }]}>
          <ListMusic size={18} color="#B69DF8" />
          <Text style={styles.sectionTitle}>
            {tr(uiLang, 'playlists')} ({playlists.length})
          </Text>
        </View>
        {playlists.map((pl) => (
          <TouchableOpacity
            key={pl.id}
            style={styles.plCard}
            onPress={() => pl.tracks[0] && playTrack(pl.tracks[0], pl.tracks)}
          >
            <View style={styles.meta}>
              <Text style={styles.trackTitle}>{pl.name}</Text>
              <Text style={styles.trackArtist}>{pl.tracks.length} tracks</Text>
            </View>
            <Play size={18} color="#B69DF8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 130, gap: 10 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 8 },
  importCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  importLabel: { color: '#E4E4E7', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  importRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1F1F26',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 13,
    height: 42
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B69DF8',
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6
  },
  importBtnText: { color: '#09090B', fontWeight: '700', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    padding: 10,
    borderRadius: 14,
    gap: 12
  },
  plCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181F',
    padding: 14,
    borderRadius: 14
  },
  art: { width: 48, height: 48, borderRadius: 10 },
  meta: { flex: 1 },
  trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  trackArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 }
});
