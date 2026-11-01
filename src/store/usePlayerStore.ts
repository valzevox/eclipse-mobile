// TypeScript / src/store/usePlayerStore.ts / Expo React Native / Zustand Audio & Lyrics Store

import { create } from 'zustand';
import { Audio } from 'expo-av';
import { TrackItem, getDefaultTrendingTracks, resolveStreamUrl } from '../services/innertube';
import { LyricLine, LyricsSource, fetchSyncedLyrics, enrichLyricsWithTranslationAndRomaji } from '../services/lyrics';
import { LangCode } from '../services/i18n';
import { ImportedPlaylist } from '../services/playlistImport';

export type AudioPreset = 'normal' | 'nightcore' | 'slowed';

interface PlayerState {
  currentTrack: TrackItem | null;
  queue: TrackItem[];
  favorites: TrackItem[];
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
  totalSecondsListened: number;

  playTrack: (track: TrackItem, newQueue?: TrackItem[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  toggleFavorite: (track: TrackItem) => void;
  setUiLang: (lang: LangCode) => void;
  setLyricsSource: (source: LyricsSource) => Promise<void>;
  adjustLyricsOffset: (delta: number) => void;
  toggleWordSync: () => void;
  toggleRomanize: () => Promise<void>;
  toggleTranslate: () => Promise<void>;
  setAudioPreset: (preset: AudioPreset) => Promise<void>;
  setTempoAndPitch: (tempo: number, pitch: number) => Promise<void>;
  setTrimRange: (start: number, end: number) => void;
  addPlaylist: (pl: ImportedPlaylist) => void;
}

let soundInstance: Audio.Sound | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: getDefaultTrendingTracks()[0],
  queue: getDefaultTrendingTracks(),
  favorites: [],
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
  totalSecondsListened: 1420,

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

    set({
      currentTrack: track,
      queue: updatedQueue,
      history: hist,
      isPlaying: true,
      position: 0,
      duration: track.duration || 180,
      trimStart: 0,
      trimEnd: track.duration || 180,
      lyrics: []
    });

    // Load synced lyrics + Romanization / Translation
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
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: get().tempo, shouldCorrectPitch: get().pitch === 1.0 },
        (status) => {
          if (!status.isLoaded) return;
          const posSec = status.positionMillis / 1000;
          const durSec = (status.durationMillis || track.duration * 1000) / 1000;
          const { trimEnd } = get();
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
            get().nextTrack();
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
    const { queue, currentTrack } = get();
    if (!queue.length || !currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
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

  toggleFavorite: (track) => {
    const { favorites } = get();
    const exists = favorites.some((t) => t.id === track.id);
    set({
      favorites: exists ? favorites.filter((t) => t.id !== track.id) : [track, ...favorites]
    });
  },

  setUiLang: (lang) => set({ uiLang: lang }),

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

  toggleWordSync: () => set((s) => ({ wordSyncEnabled: !s.wordSyncEnabled })),

  toggleRomanize: async () => {
    const nextVal = !get().romanizeEnabled;
    set({ romanizeEnabled: nextVal });
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

  addPlaylist: (pl) => set((s) => ({ playlists: [pl, ...s.playlists] }))
}));
