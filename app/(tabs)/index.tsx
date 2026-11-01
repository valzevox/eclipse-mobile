// TypeScript / app/(tabs)/index.tsx / Expo React Native / Home Screen with Regional Charts, My Wave & Quick Picks

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const pool = [...getDefaultTrendingTracks('global'), ...getDefaultTrendingTracks('vn'), ...getDefaultTrendingTracks('jp')];
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
        <View style={styles.header}>
          <Text style={styles.brand}>Eclipse</Text>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
        </View>

        <TouchableOpacity
          style={[styles.waveBanner, { borderColor: `${accentColor}44` }]}
          activeOpacity={0.9}
          onPress={startMyWave}
        >
          <View style={styles.waveLeft}>
            <View style={[styles.waveBadge, { backgroundColor: accentColor }]}>
              <Radio size={15} color="#09090B" />
              <Text style={styles.waveBadgeText}>{tr(uiLang, 'forYou')}</Text>
            </View>
            <Text style={styles.waveTitle}>{tr(uiLang, 'myWave')}</Text>
            <Text style={styles.waveDesc}>Endless personal radio with AMLL word-synced & romanized lyrics</Text>
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
                style={[styles.regionChip, active && { backgroundColor: accentColor }]}
              >
                <Text style={[styles.regionText, active && styles.regionTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
          {trending.map((item) => (
            <TouchableOpacity
              key={`${region}_${item.id}`}
              style={styles.card}
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
              <Play size={18} color={accentColor} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 130 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  brand: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  waveBanner: {
    backgroundColor: '#1E1B2E',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 24
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
  waveBadgeText: { color: '#09090B', fontSize: 11, fontWeight: '700' },
  waveTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  waveDesc: { color: '#A1A1AA', fontSize: 12, marginTop: 4 },
  wavePlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  regionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#18181F'
  },
  regionText: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  regionTextActive: { color: '#09090B', fontWeight: '700' },
  horizList: { gap: 14, paddingBottom: 24 },
  card: { width: 144 },
  cardArt: { width: 144, height: 144, borderRadius: 16, backgroundColor: '#18181B', marginBottom: 8 },
  cardTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cardArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 },
  listCol: { gap: 10 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    padding: 10,
    borderRadius: 14,
    gap: 12
  },
  rowArt: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#27272A' },
  rowMeta: { flex: 1 },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rowArtist: { color: '#A1A1AA', fontSize: 12, marginTop: 2 }
});
