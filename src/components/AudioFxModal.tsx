// TypeScript / src/components/AudioFxModal.tsx / Expo React Native / Tempo, Pitch & Trim Controls

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { usePlayerStore, AudioPreset } from '../store/usePlayerStore';
import { tr } from '../services/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AudioFxModal({ visible, onClose }: Props) {
  const { preset, tempo, pitch, trimStart, trimEnd, duration, uiLang, setAudioPreset, setTempoAndPitch, setTrimRange } =
    usePlayerStore();
  const [startStr, setStartStr] = useState(String(Math.floor(trimStart)));
  const [endStr, setEndStr] = useState(String(Math.floor(trimEnd || duration)));

  const applyTrim = () => {
    const s = Math.max(0, parseFloat(startStr) || 0);
    const e = Math.max(s, parseFloat(endStr) || duration);
    setTrimRange(s, e);
    onClose();
  };

  const presets: { key: AudioPreset; label: string }[] = [
    { key: 'normal', label: tr(uiLang, 'normal') },
    { key: 'nightcore', label: tr(uiLang, 'nightcore') },
    { key: 'slowed', label: tr(uiLang, 'slowedReverb') }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{tr(uiLang, 'audioFx')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#E4E4E7" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Presets</Text>
          <View style={styles.presetRow}>
            {presets.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setAudioPreset(p.key)}
                style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
              >
                <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>
            {tr(uiLang, 'tempo')}: {tempo.toFixed(2)}x | {tr(uiLang, 'pitch')}: {pitch.toFixed(2)}x
          </Text>
          <View style={styles.stepRow}>
            {[0.8, 0.9, 1.0, 1.1, 1.25, 1.5].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setTempoAndPitch(val, val)}
                style={[styles.stepBtn, Math.abs(tempo - val) < 0.02 && styles.presetChipActive]}
              >
                <Text style={[styles.presetText, Math.abs(tempo - val) < 0.02 && styles.presetTextActive]}>
                  {val}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Trim Loop Range (Seconds)</Text>
          <View style={styles.trimRow}>
            <View style={styles.trimBox}>
              <Text style={styles.trimLbl}>Start (s)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={startStr}
                onChangeText={setStartStr}
              />
            </View>
            <View style={styles.trimBox}>
              <Text style={styles.trimLbl}>End (s)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={endStr}
                onChangeText={setEndStr}
              />
            </View>
            <TouchableOpacity onPress={applyTrim} style={styles.applyBtn}>
              <Text style={styles.applyText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 14
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  sectionLabel: { color: '#A1A1AA', fontSize: 13, fontWeight: '600', marginTop: 4 },
  presetRow: { flexDirection: 'row', gap: 8 },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#27272A',
    alignItems: 'center'
  },
  stepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#27272A'
  },
  presetChipActive: { backgroundColor: '#B69DF8' },
  presetText: { color: '#E4E4E7', fontSize: 13, fontWeight: '600' },
  presetTextActive: { color: '#09090B', fontWeight: '700' },
  trimRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  trimBox: { flex: 1 },
  trimLbl: { color: '#71717A', fontSize: 11, marginBottom: 4 },
  input: {
    backgroundColor: '#27272A',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14
  },
  applyBtn: {
    backgroundColor: '#B69DF8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  applyText: { color: '#09090B', fontWeight: '700', fontSize: 14 }
});
