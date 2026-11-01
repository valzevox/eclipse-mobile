// TypeScript / app/(tabs)/stats.tsx / Expo React Native / Listening Stats Screen (Velune Style)

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Disc, Award } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { tr } from '../../src/services/i18n';
import { getDefaultTrendingTracks } from '../../src/services/innertube';

export default function StatsScreen() {
  const { totalSecondsListened, history, uiLang } = usePlayerStore();
  const minutes = Math.max(1, Math.round(totalSecondsListened / 60));
  const tracksPlayed = Math.max(4, history.length);

  const topArtists = useMemo(() => {
    const source = history.length > 0 ? history : getDefaultTrendingTracks();
    const counts = new Map<string, { artist: string; count: number; thumb: string }>();
    source.forEach((t) => {
      const cur = counts.get(t.artist) || { artist: t.artist, count: 0, thumb: t.thumbnail };
      cur.count += 1;
      counts.set(t.artist, cur);
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [history]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{tr(uiLang, 'listeningStats')}</Text>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Clock size={22} color="#B69DF8" />
            <Text style={styles.statVal}>{minutes}</Text>
            <Text style={styles.statLbl}>{tr(uiLang, 'totalMinutes')}</Text>
          </View>
          <View style={styles.statCard}>
            <Disc size={22} color="#FF4D6D" />
            <Text style={styles.statVal}>{tracksPlayed}</Text>
            <Text style={styles.statLbl}>{tr(uiLang, 'tracksPlayed')}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Award size={18} color="#B69DF8" />
          <Text style={styles.sectionTitle}>{tr(uiLang, 'topArtists')}</Text>
        </View>

        {topArtists.map((item, idx) => (
          <View key={item.artist} style={styles.artistRow}>
            <Text style={styles.rank}>#{idx + 1}</Text>
            <Image source={{ uri: item.thumb }} style={styles.avatar} />
            <View style={styles.meta}>
              <Text style={styles.artistName}>{item.artist}</Text>
              <Text style={styles.artistCount}>{item.count} plays</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 130, gap: 14 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  grid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  statVal: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  statLbl: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    padding: 12,
    borderRadius: 16,
    gap: 12
  },
  rank: { color: '#B69DF8', fontSize: 15, fontWeight: '800', width: 28 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#27272A' },
  meta: { flex: 1 },
  artistName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  artistCount: { color: '#A1A1AA', fontSize: 12, marginTop: 2 }
});
