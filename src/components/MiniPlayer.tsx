// TypeScript / src/components/MiniPlayer.tsx / Expo React Native / Floating Frosted Glass MiniPlayer with Dynamic Accent & BlurView

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';

export function MiniPlayer() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    nextTrack,
    favorites,
    toggleFavorite,
    position,
    duration,
    accentColor
  } = usePlayerStore();

  if (!currentTrack) return null;
  const isFav = favorites.some((t) => t.id === currentTrack.id);
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.92}
      onPress={() => router.push('/player')}
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Image source={{ uri: currentTrack.thumbnail }} style={styles.art} />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(currentTrack)} style={styles.iconBtn}>
          <Heart size={20} color={isFav ? '#FF4D6D' : '#A1A1AA'} fill={isFav ? '#FF4D6D' : 'none'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={togglePlayPause} style={[styles.playBtn, { backgroundColor: accentColor }]}>
          {isPlaying ? <Pause size={18} color="#09090B" /> : <Play size={18} color="#09090B" fill="#09090B" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={nextTrack} style={styles.iconBtn}>
          <SkipForward size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 66,
    backgroundColor: 'rgba(18, 18, 24, 0.82)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8
  },
  progressBar: {
    height: 2.5
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27272A'
  },
  meta: {
    flex: 1
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  artist: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2
  },
  iconBtn: {
    padding: 6
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
