// TypeScript / src/components/IntroOverlay.tsx / Expo React Native / Glassmorphic Intro Animation & Rotating Scalloped Badge (Ported from Riff-Muriel welcome.html & styles.css)

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { usePlayerStore } from '../store/usePlayerStore';

const { width } = Dimensions.get('window');

// Riff-Muriel 01-default.svg scalloped 19-lobe badge path
const SCALLOP_PATH =
  'M 164.61 25.00 C 173.49 23.02 183.52 29.54 191.50 28.00 C 199.48 26.46 206.84 18.06 215.39 18.25 C 223.94 18.44 230.93 27.18 238.82 29.08 C 246.71 30.98 256.98 24.91 264.26 28.32 C 271.54 31.73 275.34 42.34 281.91 46.92 C 288.48 51.50 300.01 49.33 305.51 55.20 C 311.01 61.07 310.74 72.37 315.17 79.02 C 319.60 85.67 331.02 87.64 334.09 95.05 C 337.16 102.46 332.93 112.92 334.72 120.73 C 336.51 128.54 346.46 134.50 346.79 142.52 C 347.12 150.54 339.42 158.92 338.30 166.86 C 337.18 174.80 344.22 184.08 341.65 191.68 C 339.08 199.28 328.92 204.31 325.08 211.35 C 321.24 218.39 324.64 229.47 319.57 235.72 C 314.50 241.97 303.24 242.90 297.16 248.03 C 291.08 253.16 290.30 264.69 283.24 268.62 C 276.18 272.55 265.25 269.29 257.56 271.93 C 249.87 274.57 244.97 284.99 236.98 286.25 C 228.99 287.51 220.06 280.34 211.98 280.15 C 203.90 279.96 194.66 286.71 186.74 285.08 C 178.82 283.45 174.41 272.82 166.85 269.83 C 159.29 266.84 148.20 269.59 141.32 265.34 C 134.44 261.09 134.19 249.55 128.34 244.15 C 122.49 238.75 111.27 237.33 106.50 230.85 C 101.73 224.37 105.62 213.45 102.09 206.23 C 98.56 199.01 88.64 193.52 86.42 185.81 C 84.20 178.10 91.67 169.15 90.91 161.17 C 90.15 153.19 82.82 144.47 83.53 136.46 C 84.24 128.45 94.45 122.95 96.60 115.22 C 98.75 107.49 95.01 96.86 98.41 89.59 C 101.81 82.32 113.31 80.86 118.04 74.41 C 122.77 67.96 123.02 56.66 128.78 51.05 C 134.54 45.44 145.97 48.12 152.74 43.83 C 159.51 39.54 155.73 26.98 164.61 25.00 Z';

// Eclipse coronal ring & acoustic arcs vector path
const ECLIPSE_PATH =
  'M256 36C134.497 36 36 134.497 36 256C36 377.503 134.497 476 256 476C330.185 476 395.816 439.298 435.691 383.105C411.519 401.181 381.471 411.9 348.9 411.9C268.819 411.9 203.9 346.981 203.9 266.9C203.9 186.819 268.819 121.9 348.9 121.9C381.471 121.9 411.519 132.619 435.691 150.695C395.816 94.502 330.185 36 256 36ZM372 204C364.268 204 358 210.268 358 218V316C358 323.732 364.268 330 372 330C379.732 330 386 323.732 386 316V218C386 210.268 379.732 204 372 204ZM424 176C416.268 176 410 182.268 410 190V344C410 351.732 416.268 358 424 358C431.732 358 438 351.732 438 344V190C438 182.268 431.732 176 424 176ZM320 236C312.268 236 306 242.268 306 250V284C306 291.732 312.268 298 320 298C327.732 298 334 291.732 334 284V250C334 242.268 327.732 236 320 236Z';

const LETTERS = ['e', 'c', 'l', 'i', 'p', 's', 'e'];

export function IntroOverlay() {
  const { accentColor } = usePlayerStore();
  const [visible, setVisible] = useState(true);

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlayScale = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1.38)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  const letterAnims = useRef(
    LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(36),
      scale: new Animated.Value(1.3)
    }))
  ).current;

  useEffect(() => {
    // Continuous 36s rotation matching Riff-Muriel .shape-spin
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Hero Icon Scale-In
    Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true
      })
    ]).start();

    // Letter-by-letter staggered reveal matching welcome.html .riff-title span
    const staggerAnimations = letterAnims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(320 + i * 75),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            friction: 7,
            tension: 55,
            useNativeDriver: true
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 7,
            tension: 55,
            useNativeDriver: true
          })
        ])
      ])
    );

    Animated.parallel([
      ...staggerAnimations,
      Animated.sequence([
        Animated.delay(920),
        Animated.timing(subOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true
        })
      ])
    ]).start();

    // Dismiss intro smoothly into main app
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 480,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(overlayScale, {
          toValue: 1.06,
          duration: 480,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        })
      ]).start(() => setVisible(false));
    }, 2150);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
          transform: [{ scale: overlayScale }]
        }
      ]}
    >
      <View style={[styles.meshOrbTop, { backgroundColor: accentColor }]} />
      <View style={[styles.meshOrbBottom, { backgroundColor: '#7C3AED' }]} />
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />

      <View style={styles.centerStage}>
        <Animated.View
          style={[
            styles.heroStage,
            {
              opacity: badgeOpacity,
              transform: [{ scale: badgeScale }]
            }
          ]}
        >
          <Animated.View style={[styles.spinWrap, { transform: [{ rotate }] }]}>
            <Svg width={196} height={196} viewBox="65 10 300 290">
              <Path d={SCALLOP_PATH} fill={accentColor} fillOpacity={0.22} />
            </Svg>
          </Animated.View>
          <View style={styles.logoOverlay}>
            <Svg width={94} height={94} viewBox="0 0 512 512">
              <Path d={ECLIPSE_PATH} fill="#FFFFFF" />
            </Svg>
          </View>
        </Animated.View>

        <View style={styles.wordRow}>
          {LETTERS.map((ch, idx) => (
            <Animated.Text
              key={idx}
              style={[
                styles.letter,
                {
                  opacity: letterAnims[idx].opacity,
                  transform: [
                    { translateY: letterAnims[idx].translateY },
                    { scale: letterAnims[idx].scale }
                  ]
                }
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        <Animated.View style={[styles.glassPill, { opacity: subOpacity, borderColor: `${accentColor}44` }]}>
          <View style={[styles.pillDot, { backgroundColor: accentColor }]} />
          <Text style={styles.pillText}>Lossless Audio • Zero-Delay Innertube</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#09090B',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  meshOrbTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 999,
    opacity: 0.32
  },
  meshOrbBottom: {
    position: 'absolute',
    bottom: -90,
    right: -50,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 999,
    opacity: 0.25
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroStage: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  spinWrap: {
    position: 'absolute',
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoOverlay: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  letter: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5
  },
  glassPill: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  pillText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3
  }
});
