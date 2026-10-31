import { Platform } from 'react-native';

// Night emerald + antique gold. One palette, used everywhere.
export const colors = {
  bg: '#08130F',
  bgDeep: '#050C0A',
  surface: '#0F201A',
  surfaceRaised: '#152B23',
  line: 'rgba(214, 186, 124, 0.16)',
  lineStrong: 'rgba(214, 186, 124, 0.38)',
  gold: '#D6BA7C',
  goldBright: '#EED9A4',
  goldDeep: '#A8884A',
  ivory: '#F5EEDF',
  text: '#EDE6D6',
  textMuted: '#A4B0A6',
  textFaint: '#6E7E74',
  emerald: '#1F4A3C',
  danger: '#D98C7A',
  success: '#9CC9A4',
  overlay: 'rgba(3, 8, 6, 0.72)',
} as const;

export const gradients = {
  screen: ['#0C1D17', '#08130F', '#050C0A'] as const,
  card: ['#183229', '#10231C'] as const,
  gold: ['#F0DCA8', '#D6BA7C', '#A8884A'] as const,
  goldSoft: ['rgba(214,186,124,0.22)', 'rgba(214,186,124,0.04)'] as const,
};

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  displayLight: 'CormorantGaramond_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  android: { elevation: 10 },
  default: {},
});

export const goldGlow = Platform.select({
  ios: {
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  android: { elevation: 6 },
  default: {},
});
