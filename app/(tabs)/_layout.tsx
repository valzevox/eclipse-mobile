// TypeScript / app/(tabs)/_layout.tsx / Expo React Native / Bottom Tab Navigation

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Library, BarChart2, Settings } from 'lucide-react-native';
import { MiniPlayer } from '../../src/components/MiniPlayer';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { tr } from '../../src/services/i18n';

export default function TabsLayout() {
  const { uiLang } = usePlayerStore();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#B69DF8',
          tabBarInactiveTintColor: '#71717A',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
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
  tabBar: {
    backgroundColor: '#121216',
    borderTopColor: 'rgba(255,255,255,0.06)',
    height: 62,
    paddingBottom: 8,
    paddingTop: 6
  }
});
