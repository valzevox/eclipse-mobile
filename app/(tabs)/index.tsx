// TypeScript / app/(tabs)/index.tsx / Expo React Native / Home Screen (My Wave, Trending, Quick Picks)

import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radio, Play, Flame, Clock } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { getDefaultTrendingTracks } from '../../src/services/innertube';
import { tr } from '../../src/services/i18n';

export default function HomeScreen() {
  const { playTrack, history, uiLang } = usePlayerStore();
  const trending = getDefaultTrendingTracks();
  const quickPicks = history.length > 0 ? history.slice(0, 6) : trending;

  const startMyWave = () => {
    const randomIdx = Math.floor(Math.random() * trending.length);
    playTrack(trending[randomIdx], trending);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>Eclipse</Text>
          <Text style={styles.subBrand}>Music Mobile</Text>
        </View>

        <TouchableOpacity style={styles.waveBanner} activeOpacity={0.9} onPress={startMyWave}>
          <View style={styles.waveLeft}>
            <View style={styles.waveBadge}>
              <Radio size={16} color="#09090B" />
              <Text style={styles.waveBadgeText}>{tr(uiLang, 'forYou')}</Text>
            </View>
            <Text style={styles.waveTitle}>{tr(uiLang, 'myWave')}</Text>
            <Text style={styles.waveDesc}>Personalized endless stream with synced & romanized lyrics</Text>
          </View>
          <View style={styles.wavePlayCircle}>
            <Play size={24} color="#09090B" fill="#09090B" />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Flame size={18} color="#B69DF8" />
          <Text style={styles.sectionTitle}>{tr(uiLang, 'trendingNow')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizList}>
          {trending.map((item) => (
            <TouchableOpacity
              key={item.id}
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
          <Clock size={18} color="#B69DF8" />
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
              <Play size={18} color="#B69DF8" />
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
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 18 },
  brand: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subBrand: { color: '#B69DF8', fontSize: 14, fontWeight: '600' },
  waveBanner: {
    backgroundColor: '#1E1B2E',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(182, 157, 248, 0.25)',
    marginBottom: 26
  },
  waveLeft: { flex: 1, paddingRight: 12 },
  waveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#B69DF8',
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
    backgroundColor: '#B69DF8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
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
