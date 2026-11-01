// TypeScript / app/(tabs)/settings.tsx / Expo React Native / Multilingual UI, SponsorBlock, Loudness Norm, In-App Update & Presence Settings

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Sparkles, Languages, Radio, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { UI_LANGUAGES, tr } from '../../src/services/i18n';
import { checkForAppUpdate, getCurrentAppVersion, UpdateInfo } from '../../src/services/autoUpdate';

export default function SettingsScreen() {
  const {
    uiLang,
    setUiLang,
    translationLang,
    setTranslationLang,
    wordSyncEnabled,
    romanizeEnabled,
    translateEnabled,
    sponsorBlockEnabled,
    loudnessNormEnabled,
    accentColor,
    scrobblerConfig,
    setScrobblerConfig,
    toggleWordSync,
    toggleRomanize,
    toggleTranslate,
    toggleSponsorBlock,
    toggleLoudnessNorm
  } = usePlayerStore();

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [manualUpdateMsg, setManualUpdateMsg] = useState<string | null>(null);

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    setManualUpdateMsg(null);
    const info = await checkForAppUpdate();
    setCheckingUpdate(false);
    if (info && info.hasUpdate) {
      setManualUpdateMsg(`New version v${info.version} available! Check popup or restart.`);
    } else {
      setManualUpdateMsg(`You are on the latest version v${getCurrentAppVersion()}`);
    }
  };

  const currentVer = getCurrentAppVersion();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{tr(uiLang, 'settings')}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Globe size={18} color={accentColor} />
            <Text style={styles.cardTitle}>{tr(uiLang, 'interfaceLang')}</Text>
          </View>
          <View style={styles.langGrid}>
            {UI_LANGUAGES.map((item) => {
              const active = uiLang === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => setUiLang(item.code)}
                  style={[styles.langChip, active && { backgroundColor: accentColor }]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {item.flag} {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sliders size={18} color={accentColor} />
            <Text style={styles.cardTitle}>Audio Pro & SponsorBlock</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>SponsorBlock (Skip Intro / Outro / Non-Music)</Text>
            <Switch
              value={sponsorBlockEnabled}
              onValueChange={toggleSponsorBlock}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Loudness Normalization (EBU R128)</Text>
            <Switch
              value={loudnessNormEnabled}
              onValueChange={toggleLoudnessNorm}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={18} color={accentColor} />
            <Text style={styles.cardTitle}>{tr(uiLang, 'lyrics')}</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{tr(uiLang, 'wordSync')} (AMLL / YRC)</Text>
            <Switch
              value={wordSyncEnabled}
              onValueChange={toggleWordSync}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{tr(uiLang, 'romanize')}</Text>
            <Switch
              value={romanizeEnabled}
              onValueChange={toggleRomanize}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{tr(uiLang, 'translate')}</Text>
            <Switch
              value={translateEnabled}
              onValueChange={toggleTranslate}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>

          <Text style={[styles.toggleLabel, { marginTop: 4 }]}>{tr(uiLang, 'translationLang')}</Text>
          <View style={styles.langGrid}>
            {UI_LANGUAGES.map((item) => {
              const active = translationLang === item.code;
              return (
                <TouchableOpacity
                  key={`tr_${item.code}`}
                  onPress={() => setTranslationLang(item.code)}
                  style={[styles.langChip, active && { backgroundColor: accentColor }]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {item.flag} {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Radio size={18} color={accentColor} />
            <Text style={styles.cardTitle}>Discord & Last.fm Presence</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enable Rich Presence / Scrobbling</Text>
            <Switch
              value={scrobblerConfig.enabled}
              onValueChange={(val) => setScrobblerConfig({ enabled: val })}
              trackColor={{ false: '#27272A', true: accentColor }}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Discord Webhook URL (optional)..."
            placeholderTextColor="#71717A"
            value={scrobblerConfig.discordWebhookUrl}
            onChangeText={(txt) => setScrobblerConfig({ discordWebhookUrl: txt })}
          />
          <TextInput
            style={styles.input}
            placeholder="Last.fm Username..."
            placeholderTextColor="#71717A"
            value={scrobblerConfig.lastFmUsername}
            onChangeText={(txt) => setScrobblerConfig({ lastFmUsername: txt })}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 28, height: 28, borderRadius: 7 }}
              resizeMode="contain"
            />
            <Text style={styles.cardTitle}>Eclipse v{currentVer}</Text>
          </View>
          <Text style={styles.aboutText}>
            Powered by Innertube, SoundCloud, SponsorBlock, LRCLIB, NetEase YRC, KuGou, ZingMP3 & Musixmatch. Built for iOS & Android.
          </Text>

          <TouchableOpacity
            style={[styles.checkUpdateBtn, { borderColor: `${accentColor}44` }]}
            onPress={handleManualCheckUpdate}
            disabled={checkingUpdate}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <RefreshCw size={16} color={accentColor} />
            )}
            <Text style={[styles.checkUpdateBtnText, { color: accentColor }]}>
              {checkingUpdate ? 'Checking for updates...' : 'Check for Updates'}
            </Text>
          </TouchableOpacity>

          {manualUpdateMsg && (
            <View style={styles.updateMsgRow}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.updateMsgText}>{manualUpdateMsg}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 130, gap: 16 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  card: {
    backgroundColor: '#141418',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#1F1F26'
  },
  langText: { color: '#E4E4E7', fontSize: 13, fontWeight: '600' },
  langTextActive: { color: '#09090B', fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  toggleLabel: { color: '#E4E4E7', fontSize: 13, fontWeight: '500', flex: 1, paddingRight: 10 },
  input: {
    backgroundColor: '#1F1F26',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13
  },
  aboutText: { color: '#A1A1AA', fontSize: 13, lineHeight: 20 },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 4
  },
  checkUpdateBtnText: {
    fontSize: 13,
    fontWeight: '700'
  },
  updateMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4
  },
  updateMsgText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600'
  }
});
