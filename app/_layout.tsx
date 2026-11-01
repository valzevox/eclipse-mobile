// TypeScript / app/_layout.tsx / Expo React Native / Root Stack Navigation with In-App Auto Update

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { UpdateModal } from '../src/components/UpdateModal';

export default function RootLayout() {
  const { hydrateStore } = usePlayerStore();

  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
      </Stack>
      <UpdateModal />
    </>
  );
}
