// TypeScript / app/player.tsx / Expo React Native / Fullscreen Player & Synced Lyrics Modal

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
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
  MessageSquareQuote
} from 'lucide-react-native';
import { usePlayerStore } from '../src/store/usePlayerStore';
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
    isPlaying,
    position,
    duration,
    favorites,
    uiLang,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    toggleFavorite
  } = usePlayerStore();

  const [showLyrics, setShowLyrics] = useState(true);
  const [showFx, setShowFx] = useState(false);

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
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronDown size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.modeTabs}>
            <TouchableOpacity
              onPress={() => setShowLyrics(false)}
              style={[styles.modeTab, !showLyrics && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, !showLyrics && styles.modeTabTextActive]}>Cover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLyrics(true)}
              style={[styles.modeTab, showLyrics && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, showLyrics && styles.modeTabTextActive]}>
                {tr(uiLang, 'lyrics')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShowFx(true)} style={styles.iconBtn}>
            <Sliders size={20} color="#B69DF8" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {showLyrics ? (
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
                <TouchableOpacity onPress={() => toggleFavorite(currentTrack)} style={styles.iconBtn}>
                  <Heart size={22} color={isFav ? '#FF4D6D' : '#A1A1AA'} fill={isFav ? '#FF4D6D' : 'none'} />
                </TouchableOpacity>
              </View>
              <LyricsView />
            </View>
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
            <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.transportRow}>
            <TouchableOpacity onPress={() => setShowLyrics(!showLyrics)} style={styles.iconBtn}>
              <MessageSquareQuote size={22} color={showLyrics ? '#B69DF8' : '#A1A1AA'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={prevTrack} style={styles.iconBtn}>
              <SkipBack size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.mainPlayBtn}>
              {isPlaying ? <Pause size={30} color="#09090B" /> : <Play size={30} color="#09090B" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextTrack} style={styles.iconBtn}>
              <SkipForward size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowFx(true)} style={styles.iconBtn}>
              <Sliders size={22} color="#A1A1AA" />
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99
  },
  modeTabActive: { backgroundColor: '#B69DF8' },
  modeTabText: { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
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
  compactTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  compactArtist: { color: '#A1A1AA', fontSize: 13, marginTop: 2 },
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
    height: '100%',
    backgroundColor: '#B69DF8'
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
    backgroundColor: '#B69DF8',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
