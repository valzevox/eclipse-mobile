// TypeScript / src/store/usePlayerStore.ts / Expo React Native / Zustand Audio, SponsorBlock, Loudness Norm, Sleep Timer & Dynamic Theme Store

import { create } from 'zustand';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackItem, getDefaultTrendingTracks, resolveStreamUrl, prefetchNextTracks, searchTracks } from '../services/innertube';
import { LyricLine, LyricsSource, fetchSyncedLyrics, enrichLyricsWithTranslationAndRomaji } from '../services/lyrics';
import { LangCode } from '../services/i18n';
import { ImportedPlaylist } from '../services/playlistImport';
import { ScrobblerConfig, sendNowPlayingStatus } from '../services/scrobbler';
import { SkipSegment, fetchSponsorSegments } from '../services/sponsorblock';
import { removeOfflineTrackFile, clearAllOfflineFiles } from '../services/offlineCache';

export type AudioPreset = 'normal' | 'nightcore' | 'slowed';
export type RepeatMode = 'off' | 'all' | 'one';

const ACCENT_PALETTE = ['#B69DF8', '#38BDF8', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#FB7185'];

export function deriveTrackAccent(trackId: string): string {
  if (!trackId) return '#B69DF8';
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash * 31 + trackId.charCodeAt(i)) >>> 0;
  }
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

interface PlayerState {
  currentTrack: TrackItem | null;
  queue: TrackItem[];
  favorites: TrackItem[];
  downloads: TrackItem[];
  localFiles: TrackItem[];
  playlists: ImportedPlaylist[];
  history: TrackItem[];
  isPlaying: boolean;
  position: number;
  duration: number;
  lyrics: LyricLine[];
  lyricsSource: LyricsSource;
  lyricsOffset: number;
  wordSyncEnabled: boolean;
  romanizeEnabled: boolean;
  translateEnabled: boolean;
  translationLang: string;
  uiLang: LangCode;
  tempo: number;
  pitch: number;
  preset: AudioPreset;
  trimStart: number;
  trimEnd: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  sponsorBlockEnabled: boolean;
  loudnessNormEnabled: boolean;
  skipSegments: SkipSegment[];
  sleepTimerEnd: number | null;
  sleepRemainingSec: number;
  accentColor: string;
  totalSecondsListened: number;
  scrobblerConfig: ScrobblerConfig;
  hydrated: boolean;

  hydrateStore: () => Promise<void>;
  setCustomLyrics: (lines: LyricLine[]) => void;
  setScrobblerConfig: (cfg: Partial<ScrobblerConfig>) => void;
  toggleSponsorBlock: () => void;
  toggleLoudnessNorm: () => Promise<void>;
  playTrack: (track: TrackItem, newQueue?: TrackItem[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setSleepTimer: (minutes: number | null) => void;
  removeFromQueue: (trackId: string) => void;
  toggleFavorite: (track: TrackItem) => void;
  setUiLang: (lang: LangCode) => void;
  setTranslationLang: (lang: string) => Promise<void>;
  setLyricsSource: (source: LyricsSource) => Promise<void>;
  adjustLyricsOffset: (delta: number) => void;
  toggleWordSync: () => void;
  toggleRomanize: () => Promise<void>;
  toggleTranslate: () => Promise<void>;
  setAudioPreset: (preset: AudioPreset) => Promise<void>;
  setTempoAndPitch: (tempo: number, pitch: number) => Promise<void>;
  setTrimRange: (start: number, end: number) => void;
  addPlaylist: (pl: ImportedPlaylist) => void;
  removePlaylist: (playlistId: string) => void;
  addDownload: (track: TrackItem) => void;
  removeDownload: (track: TrackItem) => Promise<void>;
  clearDownloads: () => Promise<void>;
  addLocalFiles: (tracks: TrackItem[]) => void;
}

let soundInstance: Audio.Sound | null = null;
const STORAGE_KEY = '@eclipse_mobile_state_v1';

async function savePersistedSlice(state: Partial<PlayerState>) {
  try {
    const payload = JSON.stringify({
      favorites: state.favorites,
      downloads: state.downloads,
      localFiles: state.localFiles,
      playlists: state.playlists,
      history: state.history,
      uiLang: state.uiLang,
      translationLang: state.translationLang,
      wordSyncEnabled: state.wordSyncEnabled,
      romanizeEnabled: state.romanizeEnabled,
      translateEnabled: state.translateEnabled,
      sponsorBlockEnabled: state.sponsorBlockEnabled,
      loudnessNormEnabled: state.loudnessNormEnabled,
      totalSecondsListened: state.totalSecondsListened,
      scrobblerConfig: state.scrobblerConfig
    });
    await AsyncStorage.setItem(STORAGE_KEY, payload);
  } catch (_) {}
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: getDefaultTrendingTracks()[0],
  queue: getDefaultTrendingTracks(),
  favorites: [],
  downloads: [],
  localFiles: [],
  playlists: [],
  history: [],
  isPlaying: false,
  position: 0,
  duration: 177,
  lyrics: [],
  lyricsSource: 'lrclib',
  lyricsOffset: 0,
  wordSyncEnabled: true,
  romanizeEnabled: true,
  translateEnabled: false,
  translationLang: 'vi',
  uiLang: 'vi',
  tempo: 1.0,
  pitch: 1.0,
  preset: 'normal',
  trimStart: 0,
  trimEnd: 0,
  shuffleEnabled: false,
  repeatMode: 'off',
  sponsorBlockEnabled: true,
  loudnessNormEnabled: true,
  skipSegments: [],
  sleepTimerEnd: null,
  sleepRemainingSec: 0,
  accentColor: '#B69DF8',
  totalSecondsListened: 1420,
  scrobblerConfig: {
    lastFmUsername: '',
    lastFmApiKey: '',
    discordWebhookUrl: '',
    enabled: false
  },
  hydrated: false,

  hydrateStore: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          favorites: Array.isArray(data.favorites) ? data.favorites : [],
          downloads: Array.isArray(data.downloads) ? data.downloads : [],
          localFiles: Array.isArray(data.localFiles) ? data.localFiles : [],
          playlists: Array.isArray(data.playlists) ? data.playlists : [],
          history: Array.isArray(data.history) ? data.history : [],
          uiLang: data.uiLang || 'vi',
          translationLang: data.translationLang || 'vi',
          wordSyncEnabled: typeof data.wordSyncEnabled === 'boolean' ? data.wordSyncEnabled : true,
          romanizeEnabled: typeof data.romanizeEnabled === 'boolean' ? data.romanizeEnabled : true,
          translateEnabled: typeof data.translateEnabled === 'boolean' ? data.translateEnabled : false,
          sponsorBlockEnabled: typeof data.sponsorBlockEnabled === 'boolean' ? data.sponsorBlockEnabled : true,
          loudnessNormEnabled: typeof data.loudnessNormEnabled === 'boolean' ? data.loudnessNormEnabled : true,
          totalSecondsListened: typeof data.totalSecondsListened === 'number' ? data.totalSecondsListened : 1420,
          scrobblerConfig: data.scrobblerConfig || get().scrobblerConfig,
          hydrated: true
        });
        return;
      }
    } catch (_) {}
    set({ hydrated: true });
  },

  setCustomLyrics: (lines) => set({ lyrics: lines }),

  setScrobblerConfig: (cfg) => {
    set((s) => ({ scrobblerConfig: { ...s.scrobblerConfig, ...cfg } }));
    savePersistedSlice(get());
  },

  toggleSponsorBlock: () => {
    set((s) => ({ sponsorBlockEnabled: !s.sponsorBlockEnabled }));
    savePersistedSlice(get());
  },

  toggleLoudnessNorm: async () => {
    const nextVal = !get().loudnessNormEnabled;
    set({ loudnessNormEnabled: nextVal });
    savePersistedSlice(get());
    try {
      if (soundInstance) {
        await soundInstance.setVolumeAsync(nextVal ? 0.88 : 1.0);
      }
    } catch (_) {}
  },

  playTrack: async (track, newQueue) => {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true
      });
      if (soundInstance) {
        await soundInstance.unloadAsync();
        soundInstance = null;
      }
    } catch (_) {}

    const updatedQueue = newQueue || get().queue;
    const hist = [track, ...get().history.filter((t) => t.id !== track.id)].slice(0, 50);
    const accentColor = deriveTrackAccent(track.id);

    set({
      currentTrack: track,
      queue: updatedQueue,
      history: hist,
      isPlaying: true,
      position: 0,
      duration: track.duration || 180,
      trimStart: 0,
      trimEnd: track.duration || 180,
      skipSegments: [],
      accentColor,
      lyrics: []
    });
    savePersistedSlice(get());
    sendNowPlayingStatus(track, get().scrobblerConfig);

    // Zero-wait playback: Asynchronously prefetch stream URLs for the upcoming 2 tracks in queue
    const currentIdx = updatedQueue.findIndex((t) => t.id === track.id);
    if (currentIdx !== -1) {
      const nextTracks = [
        updatedQueue[(currentIdx + 1) % updatedQueue.length],
        updatedQueue[(currentIdx + 2) % updatedQueue.length]
      ].filter(Boolean);
      prefetchNextTracks(nextTracks);
    }

    fetchSponsorSegments(track.id).then((segs) => {
      if (get().currentTrack?.id === track.id) {
        set({ skipSegments: segs });
      }
    });

    const { lyricsSource, romanizeEnabled, translateEnabled, translationLang } = get();
    fetchSyncedLyrics(track.title, track.artist, track.duration, lyricsSource).then(async (rawLines) => {
      const enriched = await enrichLyricsWithTranslationAndRomaji(
        rawLines,
        romanizeEnabled,
        translateEnabled ? translationLang : null
      );
      if (get().currentTrack?.id === track.id) {
        set({ lyrics: enriched });
      }
    });

    try {
      const uri = await resolveStreamUrl(track);
      const baseVol = get().loudnessNormEnabled ? 0.88 : 1.0;
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          volume: baseVol,
          rate: get().tempo,
          shouldCorrectPitch: get().pitch === 1.0
        },
        (status) => {
          if (!status.isLoaded) return;
          const posSec = status.positionMillis / 1000;
          const durSec = (status.durationMillis || track.duration * 1000) / 1000;
          const { trimEnd, sleepTimerEnd, sponsorBlockEnabled, skipSegments } = get();

          // SponsorBlock / Silence & Intro/Outro Auto-Skip
          if (sponsorBlockEnabled && skipSegments.length > 0) {
            const hit = skipSegments.find((s) => posSec >= s.start && posSec < s.end - 0.4);
            if (hit && hit.end < durSec) {
              soundInstance?.setPositionAsync(hit.end * 1000);
              return;
            }
          }

          if (sleepTimerEnd) {
            const rem = Math.max(0, Math.round((sleepTimerEnd - Date.now()) / 1000));
            if (rem <= 0) {
              soundInstance?.pauseAsync();
              soundInstance?.setVolumeAsync(baseVol);
              set({ isPlaying: false, sleepTimerEnd: null, sleepRemainingSec: 0 });
              return;
            }
            if (rem <= 10) {
              soundInstance?.setVolumeAsync(Math.max(0.08, (rem / 10) * baseVol));
            }
            set({ sleepRemainingSec: rem });
          }

          if (trimEnd > 0 && posSec >= trimEnd && durSec > 0 && trimEnd < durSec) {
            soundInstance?.setPositionAsync(get().trimStart * 1000);
            return;
          }

          set((state) => ({
            position: posSec,
            duration: durSec,
            isPlaying: status.isPlaying,
            totalSecondsListened: state.totalSecondsListened + (status.isPlaying ? 0.25 : 0)
          }));

          if (status.didJustFinish) {
            if (get().repeatMode === 'one') {
              soundInstance?.setPositionAsync(0);
              soundInstance?.playAsync();
            } else {
              get().nextTrack();
            }
          }
        }
      );
      soundInstance = sound;
    } catch (_) {}
  },

  togglePlayPause: async () => {
    if (!soundInstance) {
      const cur = get().currentTrack;
      if (cur) await get().playTrack(cur);
      return;
    }
    const { isPlaying } = get();
    try {
      if (isPlaying) {
        await soundInstance.pauseAsync();
        set({ isPlaying: false });
      } else {
        await soundInstance.playAsync();
        set({ isPlaying: true });
      }
    } catch (_) {}
  },

  seekTo: async (seconds) => {
    set({ position: seconds });
    try {
      if (soundInstance) {
        await soundInstance.setPositionAsync(Math.max(0, seconds * 1000));
      }
    } catch (_) {}
  },

  nextTrack: async () => {
    const { queue, currentTrack, shuffleEnabled } = get();
    if (!queue.length || !currentTrack) return;
    if (shuffleEnabled && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      await get().playTrack(chosen);
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === queue.length - 1 && get().repeatMode === 'off') {
      const more = await searchTracks(currentTrack.artist, 'ytmusic');
      const fresh = more.filter((m) => !queue.some((q) => q.id === m.id)).slice(0, 5);
      if (fresh.length > 0) {
        const expanded = [...queue, ...fresh];
        await get().playTrack(fresh[0], expanded);
        return;
      }
    }
    const next = queue[(idx + 1) % queue.length];
    await get().playTrack(next);
  },

  prevTrack: async () => {
    const { queue, currentTrack, position } = get();
    if (position > 4) {
      await get().seekTo(0);
      return;
    }
    if (!queue.length || !currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    await get().playTrack(prev);
  },

  toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),

  cycleRepeatMode: () =>
    set((s) => {
      const order: RepeatMode[] = ['off', 'all', 'one'];
      const next = order[(order.indexOf(s.repeatMode) + 1) % order.length];
      return { repeatMode: next };
    }),

  setSleepTimer: (minutes) => {
    if (!minutes || minutes <= 0) {
      soundInstance?.setVolumeAsync(get().loudnessNormEnabled ? 0.88 : 1.0);
      set({ sleepTimerEnd: null, sleepRemainingSec: 0 });
      return;
    }
    const end = Date.now() + minutes * 60 * 1000;
    set({ sleepTimerEnd: end, sleepRemainingSec: minutes * 60 });
  },

  removeFromQueue: (trackId) =>
    set((s) => ({
      queue: s.queue.filter((t) => t.id !== trackId)
    })),

  toggleFavorite: (track) => {
    const { favorites } = get();
    const exists = favorites.some((t) => t.id === track.id);
    set({
      favorites: exists ? favorites.filter((t) => t.id !== track.id) : [track, ...favorites]
    });
    savePersistedSlice(get());
  },

  setUiLang: (lang) => {
    set({ uiLang: lang });
    savePersistedSlice(get());
  },

  setTranslationLang: async (lang) => {
    set({ translationLang: lang });
    savePersistedSlice(get());
    const { lyrics, romanizeEnabled, translateEnabled } = get();
    if (lyrics.length && translateEnabled) {
      const enriched = await enrichLyricsWithTranslationAndRomaji(lyrics, romanizeEnabled, lang);
      set({ lyrics: enriched });
    }
  },

  setLyricsSource: async (source) => {
    set({ lyricsSource: source });
    const { currentTrack, romanizeEnabled, translateEnabled, translationLang } = get();
    if (!currentTrack) return;
    const rawLines = await fetchSyncedLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, source);
    const enriched = await enrichLyricsWithTranslationAndRomaji(
      rawLines,
      romanizeEnabled,
      translateEnabled ? translationLang : null
    );
    set({ lyrics: enriched });
  },

  adjustLyricsOffset: (delta) => {
    set((s) => ({ lyricsOffset: Math.round((s.lyricsOffset + delta) * 10) / 10 }));
  },

  toggleWordSync: () => {
    set((s) => ({ wordSyncEnabled: !s.wordSyncEnabled }));
    savePersistedSlice(get());
  },

  toggleRomanize: async () => {
    const nextVal = !get().romanizeEnabled;
    set({ romanizeEnabled: nextVal });
    savePersistedSlice(get());
    const { lyrics, translateEnabled, translationLang } = get();
    if (lyrics.length) {
      const enriched = await enrichLyricsWithTranslationAndRomaji(
        lyrics,
        nextVal,
        translateEnabled ? translationLang : null
      );
      set({ lyrics: enriched });
    }
  },

  toggleTranslate: async () => {
    const nextVal = !get().translateEnabled;
    set({ translateEnabled: nextVal });
    savePersistedSlice(get());
    const { lyrics, romanizeEnabled, translationLang } = get();
    if (lyrics.length) {
      const enriched = await enrichLyricsWithTranslationAndRomaji(
        lyrics,
        romanizeEnabled,
        nextVal ? translationLang : null
      );
      set({ lyrics: enriched });
    }
  },

  setAudioPreset: async (preset) => {
    let tempo = 1.0;
    let pitch = 1.0;
    if (preset === 'nightcore') {
      tempo = 1.25;
      pitch = 1.25;
    } else if (preset === 'slowed') {
      tempo = 0.85;
      pitch = 0.85;
    }
    set({ preset, tempo, pitch });
    try {
      if (soundInstance) {
        await soundInstance.setRateAsync(tempo, preset === 'normal');
      }
    } catch (_) {}
  },

  setTempoAndPitch: async (tempo, pitch) => {
    set({ tempo, pitch, preset: 'normal' });
    try {
      if (soundInstance) {
        await soundInstance.setRateAsync(tempo, pitch === 1.0);
      }
    } catch (_) {}
  },

  setTrimRange: (start, end) => set({ trimStart: start, trimEnd: end }),

  addPlaylist: (pl) => {
    set((s) => ({ playlists: [pl, ...s.playlists] }));
    savePersistedSlice(get());
  },

  removePlaylist: (playlistId) => {
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== playlistId) }));
    savePersistedSlice(get());
  },

  addDownload: (track) => {
    set((s) => ({
      downloads: [track, ...s.downloads.filter((t) => t.id !== track.id)]
    }));
    savePersistedSlice(get());
  },

  removeDownload: async (track) => {
    await removeOfflineTrackFile(track);
    set((s) => ({
      downloads: s.downloads.filter((t) => t.id !== track.id)
    }));
    savePersistedSlice(get());
  },

  clearDownloads: async () => {
    await clearAllOfflineFiles();
    set({ downloads: [] });
    savePersistedSlice(get());
  },

  addLocalFiles: (tracks) => {
    set((s) => ({
      localFiles: [...tracks, ...s.localFiles]
    }));
    savePersistedSlice(get());
  }
}));
