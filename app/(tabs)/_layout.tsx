// TypeScript / app/(tabs)/_layout.tsx / Expo React Native / Ambient Mesh Glassmorphic Bottom Tab Navigation

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Search, Library, BarChart2, Settings } from 'lucide-react-native';
import { MiniPlayer } from '../../src/components/MiniPlayer';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { tr } from '../../src/services/i18n';

const { width } = Dimensions.get('window');

export default function TabsLayout() {
  const { uiLang, accentColor, hydrateStore } = usePlayerStore();

  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <View style={styles.root}>
      {/* Ambient Glassmorphic Mesh Orbs matching Eclipse Desktop .bg-mesh-layer */}
      <View style={[styles.meshOrbPrimary, { backgroundColor: accentColor }]} pointerEvents="none" />
      <View style={styles.meshOrbSecondary} pointerEvents="none" />

      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          ),
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: '#A1A1AA',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: -0.2 }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: tr(uiLang, 'home'),
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: tr(uiLang, 'search'),
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: tr(uiLang, 'library'),
            tabBarIcon: ({ color, size }) => <Library color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: tr(uiLang, 'stats'),
            tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: tr(uiLang, 'settings'),
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090B' },
  meshOrbPrimary: {
    position: 'absolute',
    top: -110,
    left: -60,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 999,
    opacity: 0.16
  },
  meshOrbSecondary: {
    position: 'absolute',
    bottom: 90,
    right: -80,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 999,
    backgroundColor: '#6366F1',
    opacity: 0.12
  },
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(18, 18, 24, 0.68)',
    borderTopColor: 'rgba(255,255,255,0.10)',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 0
  }
});
