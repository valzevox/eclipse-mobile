// TypeScript / src/services/shapes.ts / Expo React Native / Cover Art Shape Profiles & Cycling (Ported from Riff-Muriel src/renderer/shapes.js)

export type CoverShapeId = 'rounded' | 'circle' | 'vinyl' | 'arch' | 'pill' | 'squircle';

export interface CoverShapePreset {
  id: CoverShapeId;
  label: string;
  borderRadius: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  showVinylHole?: boolean;
}

export const COVER_SHAPES: CoverShapePreset[] = [
  { id: 'rounded', label: 'Default', borderRadius: 28 },
  { id: 'vinyl', label: 'Vinyl Disc', borderRadius: 145, showVinylHole: true },
  { id: 'circle', label: 'Orbit', borderRadius: 145 },
  { id: 'arch', label: 'Horizon Arch', borderRadius: 28, borderTopLeftRadius: 145, borderTopRightRadius: 145 },
  { id: 'pill', label: 'Capsule', borderRadius: 90 },
  { id: 'squircle', label: 'Minimal Box', borderRadius: 12 }
];

export function nextCoverShape(currentId: CoverShapeId): CoverShapePreset {
  const idx = COVER_SHAPES.findIndex((s) => s.id === currentId);
  return COVER_SHAPES[(idx + 1) % COVER_SHAPES.length];
}
