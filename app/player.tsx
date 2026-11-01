// TypeScript / app/player.tsx / Expo React Native / Fullscreen Player, AMLL Synced Lyrics & Up Next Queue

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Sliders,
  Download,
  Shuffle,
  Repeat,
  Repeat1,
  Trash2
} from 'lucide-react-native';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { downloadTrackOffline } from '../src/services/offlineCache';
import { LyricsView } from '../src/components/LyricsView';
import { AudioFxModal } from '../src/components/AudioFxModal';
import { tr } from '../src/services/i18n';

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    queue,
    isPlaying,
    position,
    duration,
    favorites,
    downloads,
    uiLang,
    shuffleEnabled,
    repeatMode,
    accentColor,
    sleepRemainingSec,
    playTrack,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    toggleShuffle,
    cycleRepeatMode,
    removeFromQueue,
    toggleFavorite,
    addDownload
  } = usePlayerStore();

  const [tab, setTab] = useState<'cover' | 'lyrics' | 'queue'>('lyrics');
  const [showFx, setShowFx] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{tr(uiLang, 'noTrackPlaying')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFav = favorites.some((t) => t.id === currentTrack.id);
  const isDownloaded = downloads.some((t) => t.id === currentTrack.id);
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  const handleDownload = async () => {
    if (downloading || isDownloaded) return;
    setDownloading(true);
    const cached = await downloadTrackOffline(currentTrack);
    if (cached) addDownload(cached);
    setDownloading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronDown size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.modeTabs}>
            {(['cover', 'lyrics', 'queue'] as const).map((key) => {
              const active = tab === key;
              const label =
                key === 'cover' ? 'Cover' : key === 'lyrics' ? tr(uiLang, 'lyrics') : `Queue (${queue.length})`;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTab(key)}
                  style={[styles.modeTab, active && { backgroundColor: accentColor }]}
                >
                  <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setShowFx(true)} style={styles.iconBtn}>
            <Sliders size={20} color={accentColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {tab === 'lyrics' ? (
            <View style={styles.lyricsWrap}>
              <View style={styles.compactHeader}>
                <Image source={{ uri: currentTrack.thumbnail }} style={styles.compactArt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.compactTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.compactArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
                  <Download size={20} color={isDownloaded ? '#10B981' : '#A1A1AA'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleFavorite(currentTrack)} style={styles.iconBtn}>
                  <Heart size={22} color={isFav ? '#FF4D6D' : '#A1A1AA'} fill={isFav ? '#FF4D6D' : 'none'} />
                </TouchableOpacity>
              </View>
              <LyricsView />
            </View>
          ) : tab === 'queue' ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
              {queue.map((item) => {
                const active = item.id === currentTrack.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.queueRow, active && { borderColor: accentColor, borderWidth: 1 }]}
                    onPress={() => playTrack(item)}
                  >
                    <Image source={{ uri: item.thumbnail }} style={styles.queueArt} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.compactTitle, active && { color: accentColor }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.compactArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                    {!active && (
                      <TouchableOpacity onPress={() => removeFromQueue(item.id)} style={styles.iconBtn}>
                        <Trash2 size={16} color="#71717A" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.coverWrap}>
              <Image source={{ uri: currentTrack.thumbnail }} style={styles.bigArt} />
              <View style={styles.trackMetaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bigTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.bigArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(currentTrack)} style={styles.iconBtn}>
                  <Heart size={26} color={isFav ? '#FF4D6D' : '#A1A1AA'} fill={isFav ? '#FF4D6D' : 'none'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.controlsArea}>
          <TouchableOpacity
            style={styles.seekTrack}
            activeOpacity={0.9}
            onPress={(e) => {
              const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / 320));
              seekTo(ratio * duration);
            }}
          >
            <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            {sleepRemainingSec > 0 && (
              <Text style={[styles.timeText, { color: accentColor }]}>
                Sleep {Math.ceil(sleepRemainingSec / 60)}m
              </Text>
            )}
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.transportRow}>
            <TouchableOpacity onPress={toggleShuffle} style={styles.iconBtn}>
              <Shuffle size={20} color={shuffleEnabled ? accentColor : '#A1A1AA'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={prevTrack} style={styles.iconBtn}>
              <SkipBack size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePlayPause}
              style={[styles.mainPlayBtn, { backgroundColor: accentColor }]}
            >
              {isPlaying ? <Pause size={30} color="#09090B" /> : <Play size={30} color="#09090B" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextTrack} style={styles.iconBtn}>
              <SkipForward size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={cycleRepeatMode} style={styles.iconBtn}>
              {repeatMode === 'one' ? (
                <Repeat1 size={20} color={accentColor} />
              ) : (
                <Repeat size={20} color={repeatMode === 'all' ? accentColor : '#A1A1AA'} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <AudioFxModal visible={showFx} onClose={() => setShowFx(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0C14' },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#A1A1AA', fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  iconBtn: { padding: 8 },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    padding: 3
  },
  modeTab: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 99
  },
  modeTabText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  modeTabTextActive: { color: '#09090B', fontWeight: '700' },
  body: { flex: 1, marginVertical: 8 },
  lyricsWrap: { flex: 1 },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  compactArt: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#27272A' },
  compactTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  compactArtist: { color: '#A1A1AA', fontSize: 13, marginTop: 2 },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141A',
    padding: 10,
    borderRadius: 14,
    gap: 12
  },
  queueArt: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#27272A' },
  coverWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  bigArt: { width: 290, height: 290, borderRadius: 28, backgroundColor: '#18181B' },
  trackMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 6
  },
  bigTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  bigArtist: { color: '#A1A1AA', fontSize: 15, marginTop: 4 },
  controlsArea: { paddingTop: 8 },
  seekTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  seekFill: {
    height: '100%'
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14
  },
  timeText: { color: '#A1A1AA', fontSize: 12 },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10
  },
  mainPlayBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
