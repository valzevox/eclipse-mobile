// TypeScript / src/components/UpdateModal.tsx / Expo React Native / In-App Auto Update Modal & Just-Updated Changelog Dialog

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Sparkles, Download, CheckCircle2, X, ArrowUpCircle } from 'lucide-react-native';
import {
  UpdateInfo,
  checkForAppUpdate,
  checkJustUpdatedChangelog,
  downloadAndInstallApk,
  getCurrentAppVersion,
  dismissUpdateNotice
} from '../services/autoUpdate';
import { usePlayerStore } from '../store/usePlayerStore';

export function UpdateModal() {
  const { accentColor } = usePlayerStore();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // Modal thông báo "Đã update thành công / What's New"
  const [changelogBody, setChangelogBody] = useState<string | null>(null);
  const [showChangelogModal, setShowChangelogModal] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app vừa mới được update từ phiên bản trước đó hay không
    checkJustUpdatedChangelog().then((notes) => {
      if (notes) {
        setChangelogBody(notes);
        setShowChangelogModal(true);
      }
    });

    // 2. Tự động kiểm tra bản update mới trên GitHub Releases
    checkForAppUpdate().then((info) => {
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setShowUpdateModal(true);
      }
    });
  }, []);

  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    setDownloadProgress(0);
    setIsInstalling(false);

    const res = await downloadAndInstallApk(updateInfo.downloadUrl, (pct) => {
      setDownloadProgress(pct);
    });

    if (res.success) {
      setIsInstalling(true);
    }
  };

  const handleDismiss = () => {
    if (updateInfo) {
      dismissUpdateNotice(updateInfo.version);
    }
    setShowUpdateModal(false);
  };

  const currentVer = getCurrentAppVersion();

  return (
    <>
      {/* 1. Modal thông báo cập nhật mới (Available Update) */}
      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalCard}>
            <View style={styles.headerRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${accentColor}25` }]}>
                <ArrowUpCircle size={26} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>New Update Available</Text>
                <Text style={styles.subTitle}>
                  v{currentVer} → v{updateInfo?.version}
                </Text>
              </View>
              {downloadProgress === null && (
                <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                  <X size={20} color="#71717A" />
                </TouchableOpacity>
              )}
            </View>

            {updateInfo?.releaseNotes ? (
              <ScrollView style={styles.notesWrap} contentContainerStyle={{ paddingVertical: 8 }}>
                <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.emptyNotes}>Bug fixes and performance improvements are included.</Text>
            )}

            {downloadProgress !== null ? (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {isInstalling ? 'Opening package installer...' : 'Downloading update...'}
                  </Text>
                  <Text style={[styles.progressPct, { color: accentColor }]}>{downloadProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${downloadProgress}%`, backgroundColor: accentColor }
                    ]}
                  />
                </View>
                {isInstalling && (
                  <ActivityIndicator size="small" color={accentColor} style={{ marginTop: 8 }} />
                )}
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={handleDismiss} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartUpdate}
                  style={[styles.primaryBtn, { backgroundColor: accentColor }]}
                >
                  <Download size={18} color="#09090B" />
                  <Text style={styles.primaryBtnText}>Update Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Modal thông báo vừa update xong (What's New in this version) */}
      <Modal visible={showChangelogModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalCard}>
            <View style={styles.headerRow}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Sparkles size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Updated to v{currentVer}!</Text>
                <Text style={[styles.subTitle, { color: '#10B981' }]}>What's New in Eclipse</Text>
              </View>
              <TouchableOpacity onPress={() => setShowChangelogModal(false)} style={styles.closeBtn}>
                <X size={20} color="#71717A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notesWrap} contentContainerStyle={{ paddingVertical: 8 }}>
              <Text style={styles.notesText}>{changelogBody}</Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowChangelogModal(false)}
              style={[styles.primaryBtn, { backgroundColor: accentColor, width: '100%', justifyContent: 'center' }]}
            >
              <CheckCircle2 size={18} color="#09090B" />
              <Text style={styles.primaryBtnText}>Got it, let's play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#16161E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  subTitle: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  notesWrap: {
    maxHeight: 220,
    backgroundColor: '#0F0F14',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  notesText: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 20
  },
  emptyNotes: {
    color: '#A1A1AA',
    fontSize: 13,
    marginVertical: 16
  },
  progressSection: {
    marginTop: 8
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600'
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800'
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  secondaryBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600'
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14
  },
  primaryBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '800'
  }
});
