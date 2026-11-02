// TypeScript / app/(tabs)/index.tsx / Expo React Native / Glassmorphic Home Screen with Regional Charts, My Wave & Quick Picks

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Radio, Play, Flame, Clock } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { getDefaultTrendingTracks, ChartRegion } from '../../src/services/innertube';
import { tr } from '../../src/services/i18n';

export default function HomeScreen() {
  const { playTrack, history, uiLang, accentColor } = usePlayerStore();
  const [region, setRegion] = useState<ChartRegion>('global');
  const trending = getDefaultTrendingTracks(region);
  const quickPicks = history.length > 0 ? history.slice(0, 8) : trending;

  const startMyWave = () => {
    const pool = [
      ...getDefaultTrendingTracks('global'),
      ...getDefaultTrendingTracks('vn'),
      ...getDefaultTrendingTracks('jp')
    ];
    const randomIdx = Math.floor(Math.random() * pool.length);
    playTrack(pool[randomIdx], pool);
  };

  const regions: { key: ChartRegion; label: string }[] = [
    { key: 'global', label: '🌐 Global' },
    { key: 'vn', label: '🇻🇳 V-Pop' },
    { key: 'jp', label: '🇯🇵 J-Pop' },
    { key: 'kr', label: '🇰🇷 K-Pop' }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={[styles.logoBox, { borderColor: `${accentColor}44` }]}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.greetingText}>
                {new Date().getHours() < 12
                  ? 'Good morning'
                  : new Date().getHours() < 18
                  ? 'Good afternoon'
                  : 'Good evening'}
              </Text>
              <View style={styles.brandTitleWrap}>
                <Text style={styles.brand}>Eclipse</Text>
                <View style={[styles.dot, { backgroundColor: accentColor }]} />
              </View>
            </View>
          </View>
          <View style={[styles.livePill, { borderColor: `${accentColor}55` }]}>
            <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.liveText, { color: accentColor }]}>FLAC / HI-RES</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.waveBanner, { borderColor: `${accentColor}55` }]}
          activeOpacity={0.9}
          onPress={startMyWave}
        >
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.waveLeft}>
            <View style={[styles.waveBadge, { backgroundColor: accentColor }]}>
              <Radio size={15} color="#09090B" />
              <Text style={styles.waveBadgeText}>{tr(uiLang, 'forYou')}</Text>
            </View>
            <Text style={styles.waveTitle}>{tr(uiLang, 'myWave')}</Text>
            <Text style={styles.waveDesc}>
              Endless personal radio with AMLL word-synced & romanized lyrics
            </Text>
          </View>
          <View style={[styles.wavePlayCircle, { backgroundColor: accentColor }]}>
            <Play size={24} color="#09090B" fill="#09090B" />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Flame size={18} color={accentColor} />
          <Text style={styles.sectionTitle}>{tr(uiLang, 'trendingNow')}</Text>
        </View>

        <View style={styles.regionRow}>
          {regions.map((r) => {
            const active = region === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRegion(r.key)}
                style={[
                  styles.regionChip,
                  active && { backgroundColor: accentColor, borderColor: accentColor }
                ]}
              >
                <Text style={[styles.regionText, active && styles.regionTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizList}
        >
          {trending.map((item) => (
            <TouchableOpacity
              key={`${region}_${item.id}`}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => playTrack(item, trending)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.cardArt} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardArtist} numberOfLines={1}>
                {item.artist}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Clock size={18} color={accentColor} />
          <Text style={styles.sectionTitle}>{tr(uiLang, 'quickPicks')}</Text>
        </View>
        <View style={styles.listCol}>
          {quickPicks.map((item) => (
            <TouchableOpacity
              key={`qp_${item.id}`}
              style={styles.rowItem}
              activeOpacity={0.85}
              onPress={() => playTrack(item, quickPicks)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.rowArt} />
              <View style={styles.rowMeta}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <View style={[styles.playCircle, { backgroundColor: `${accentColor}22` }]}>
                <Play size={16} color={accentColor} fill={accentColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 140 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  brandLogo: { width: 38, height: 38, borderRadius: 10 },
  brandTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 2
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  brand: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  waveBanner: {
    backgroundColor: 'rgba(182, 157, 248, 0.12)',
    borderRadius: 26,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden'
  },
  waveLeft: { flex: 1, paddingRight: 12 },
  waveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 5,
    marginBottom: 10
  },
  waveBadgeText: { color: '#09090B', fontSize: 11, fontWeight: '800' },
  waveTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  waveDesc: { color: '#D4D4D8', fontSize: 12, marginTop: 4, lineHeight: 17 },
  wavePlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  regionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  regionChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)'
  },
  regionText: { color: '#D4D4D8', fontSize: 12, fontWeight: '600' },
  regionTextActive: { color: '#09090B', fontWeight: '800' },
  horizList: { gap: 14, paddingBottom: 24 },
  card: {
    width: 148,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  cardArt: {
    width: 130,
    height: 130,
    borderRadius: 14,
    backgroundColor: '#18181B',
    marginBottom: 8
  },
  cardTitle: { color: '#FFF', fontSize: 13, fontWeight: '700', paddingHorizontal: 2 },
  cardArtist: { color: '#A1A1AA', fontSize: 11, marginTop: 2, paddingHorizontal: 2 },
  listCol: { gap: 10 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  rowArt: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#27272A' },
  rowMeta: { flex: 1 },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rowArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  playCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
