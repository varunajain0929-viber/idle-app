export const colors = {
  ink: '#1A1A1A',
  inkSoft: '#2C2C2C',
  inkDeep: '#0E0E0E',
  cream: '#F5F0E8',
  creamSoft: '#EBE5D9',
  creamEdge: '#DDD5C5',
  creamLine: 'rgba(26, 26, 26, 0.08)',
  pink: '#FF3D6E',
  pinkBright: '#FF5580',
  muted: 'rgba(26, 26, 26, 0.5)',
  ink70: 'rgba(26, 26, 26, 0.70)',
  ink50: 'rgba(26, 26, 26, 0.50)',
  ink30: 'rgba(26, 26, 26, 0.30)',
  ink15: 'rgba(26, 26, 26, 0.15)',
  ink08: 'rgba(26, 26, 26, 0.08)',
  cream70: 'rgba(245, 240, 232, 0.70)',
  cream50: 'rgba(245, 240, 232, 0.50)',
  cream30: 'rgba(245, 240, 232, 0.30)',
} as const;

export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
  s8: 64,
  s9: 96,
  s10: 128,
} as const;

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  iosIcon: 22,
  pill: 999,
} as const;

export const fontFamily = {
  displayRegular: 'BricolageGrotesque_400Regular',
  displayMedium: 'BricolageGrotesque_500Medium',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  bodyRegular: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'uppercase' | 'none';
};

export const type: Record<
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'lede'
  | 'body'
  | 'bodyMd'
  | 'bodySm'
  | 'caption'
  | 'mono',
  TypeStyle
> = {
  hero: {
    fontFamily: fontFamily.displayHeavy,
    fontSize: 96,
    lineHeight: 96 * 0.9,
    letterSpacing: -0.06 * 96,
  },
  h1: {
    fontFamily: fontFamily.displayHeavy,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -0.04 * 44,
  },
  h2: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 30,
    lineHeight: 30 * 1.15,
    letterSpacing: -0.025 * 30,
  },
  h3: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 22,
    lineHeight: 22 * 1.2,
    letterSpacing: -0.02 * 22,
  },
  lede: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 19,
    lineHeight: 19 * 1.55,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 17 * 1.5,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 17,
    lineHeight: 17 * 1.5,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 13 * 1.5,
    letterSpacing: 0,
  },
  mono: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 11,
    lineHeight: 11 * 1.6,
    letterSpacing: 0.18 * 11,
    textTransform: 'uppercase',
  },
};

export const motion = {
  hover: 120,
  layout: 200,
  ceremony: 400,
  easing: [0.22, 0.61, 0.36, 1] as const,
} as const;
