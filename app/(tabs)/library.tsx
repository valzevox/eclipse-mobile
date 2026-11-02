// TypeScript / app/(tabs)/library.tsx / Expo React Native / Glassmorphic Library & Fast Multi-Platform Playlist Importer

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Heart, PlusCircle, Play, ListMusic, Download, FolderOpen, Trash2, CheckCircle2 } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { importExternalPlaylist } from '../../src/services/playlistImport';
import { pickLocalAudioFiles } from '../../src/services/offlineCache';
import { tr } from '../../src/services/i18n';

export default function LibraryScreen() {
  const router = useRouter();
  const {
    favorites,
    downloads,
    localFiles,
    playlists,
    accentColor,
    playTrack,
    addPlaylist,
    removePlaylist,
    removeDownload,
    clearDownloads,
    addLocalFiles,
    uiLang
  } = usePlayerStore();
  const [importInput, setImportInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleImport = async () => {
    if (!importInput.trim() || importing) return;
    setImporting(true);
    setStatusMsg('Importing playlist tracks via direct Innertube / Pathfinder...');
    try {
      const pl = await importExternalPlaylist(importInput);
      addPlaylist(pl);
      setImportInput('');
      setStatusMsg(`Imported "${pl.name}" (${pl.tracks.length} tracks)`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (_) {
      setStatusMsg('Could not import playlist. Check URL and try again.');
    } finally {
      setImporting(false);
    }
  };

  const handlePickLocal = async () => {
    const picked = await pickLocalAudioFiles();
    if (picked.length > 0) {
      addLocalFiles(picked);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{tr(uiLang, 'library')}</Text>
          <TouchableOpacity style={[styles.localBtn, { borderColor: `${accentColor}55` }]} onPress={handlePickLocal}>
            <FolderOpen size={16} color={accentColor} />
            <Text style={[styles.localBtnText, { color: accentColor }]}>Local Files ({localFiles.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.importCard, { borderColor: `${accentColor}33` }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Text style={styles.importLabel}>Import Playlist (Spotify / YT Music / Apple / Yandex / NetEase)</Text>
          <View style={styles.importRow}>
            <TextInput
              style={styles.input}
              placeholder="Paste playlist or album URL..."
              placeholderTextColor="#A1A1AA"
              value={importInput}
              onChangeText={setImportInput}
              onSubmitEditing={handleImport}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: accentColor, opacity: importing ? 0.7 : 1 }]}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#09090B" />
              ) : (
                <PlusCircle size={18} color="#09090B" />
              )}
              <Text style={styles.importBtnText}>{importing ? 'Importing' : 'Import'}</Text>
            </TouchableOpacity>
          </View>
          {statusMsg && (
            <View style={styles.statusRow}>
              <CheckCircle2 size={14} color={accentColor} />
              <Text style={[styles.statusText, { color: accentColor }]} numberOfLines={1}>
                {statusMsg}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 6 }]}>
          <ListMusic size={18} color={accentColor} />
          <Text style={styles.sectionTitle}>
            {tr(uiLang, 'playlists')} ({playlists.length})
          </Text>
        </View>
        {playlists.map((pl) => (
          <TouchableOpacity
            key={pl.id}
            style={styles.plCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/playlist/${pl.id}`)}
          >
            <Image
              source={{ uri: pl.tracks[0]?.thumbnail || 'https://i.ytimg.com/vi/Y8JFxS1HlDo/hqdefault.jpg' }}
              style={styles.art}
            />
            <View style={styles.meta}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {pl.name}
              </Text>
              <Text style={styles.trackArtist}>{pl.tracks.length} tracks • Tap to open</Text>
            </View>
            <TouchableOpacity onPress={() => removePlaylist(pl.id)} style={{ padding: 8 }}>
              <Trash2 size={16} color="#71717A" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (pl.tracks.length > 0) playTrack(pl.tracks[0], pl.tracks);
              }}
              style={[styles.playCircle, { backgroundColor: `${accentColor}22` }]}
            >
              <Play size={16} color={accentColor} fill={accentColor} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={[styles.sectionHeader, { marginTop: 14 }]}>
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
            <Play size={18} color={accentColor} />
          </TouchableOpacity>
        ))}

        <View style={[styles.sectionHeader, { marginTop: 14, justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Download size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>
              {tr(uiLang, 'downloads')} ({downloads.length})
            </Text>
          </View>
          {downloads.length > 0 && (
            <TouchableOpacity onPress={clearDownloads} style={styles.clearBtn}>
              <Trash2 size={14} color="#EF4444" />
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {downloads.map((item) => (
          <TouchableOpacity key={`dl_${item.id}`} style={styles.row} onPress={() => playTrack(item, downloads)}>
            <Image source={{ uri: item.thumbnail }} style={styles.art} />
            <View style={styles.meta}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeDownload(item)} style={{ padding: 6 }}>
              <Trash2 size={16} color="#71717A" />
            </TouchableOpacity>
            <Play size={18} color="#10B981" />
          </TouchableOpacity>
        ))}

        {localFiles.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
              <FolderOpen size={18} color={accentColor} />
              <Text style={styles.sectionTitle}>Local Audio ({localFiles.length})</Text>
            </View>
            {localFiles.map((item) => (
              <TouchableOpacity key={item.id} style={styles.row} onPress={() => playTrack(item, localFiles)}>
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
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 140, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  localBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1
  },
  localBtnText: { fontSize: 12, fontWeight: '700' },
  importCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden'
  },
  importLabel: { color: '#E4E4E7', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  importRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    borderRadius: 14,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 13,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)'
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6
  },
  importBtnText: { color: '#09090B', fontWeight: '800', fontSize: 13 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99
  },
  clearText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
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
  plCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)'
  },
  art: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#27272A' },
  meta: { flex: 1 },
  trackTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  trackArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
