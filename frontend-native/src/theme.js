/* ============================================================
   Schoolyard design tokens — ported from frontend/src/styles/tokens.css
   to a plain JS object for React Native StyleSheet consumption.
   ============================================================ */
import { Platform } from 'react-native';

export const colors = {
  primary: '#2D5A3D',
  primary700: '#214530',
  primary200: '#B7CDB9',
  primary100: '#DCE7DA',
  primary50: '#ECF1E5',

  accent: '#C8553D',
  accent700: '#A2412E',
  accent100: '#F5D8CE',
  accent50: '#FBEDE7',

  info: '#3E5C8B',
  info100: '#CFD9E7',
  info50: '#E7EDF4',

  paper: '#FAF6EE',
  paperSink: '#F3EDDF',
  cardCream: '#FFFBF2',
  rule: '#E5DDC9',
  ruleStrong: '#C8BFA6',

  ink: '#1F1A14',
  ink2: '#4A4337',
  ink3: '#7A7160',
  ink4: '#A89E89',

  success: '#2D5A3D',
  successBg: '#ECF1E5',
  neutralBg: '#F3EDDF',

  gold: '#E8B547',
  goldDeep: '#B07A1E',
  gold50: '#FBF1D7',
  gold100: '#F6E4B5',

  white: '#FFFFFF',
};

export const radius = { r1: 4, r2: 8, r3: 12, r4: 16, pill: 9999 };

/* Heebo on web (loaded via expo-google-fonts-less CDN link injected in App);
   native falls back to the system font, which renders Hebrew fine. */
export const fontFamily = Platform.select({ web: 'Heebo, system-ui, sans-serif', default: undefined });

export const shadowPop = Platform.select({
  web: { boxShadow: '0 6px 24px -8px rgba(31,26,20,0.18), 0 1px 0 rgba(31,26,20,0.04)' },
  default: {
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
});

export const shadowModal = Platform.select({
  web: { boxShadow: '0 24px 60px -20px rgba(31,26,20,0.35), 0 2px 6px rgba(31,26,20,0.08)' },
  default: {
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
});

/* mobile breakpoint — mirrors the original useViewport (< 880px) */
export const MOBILE_BREAKPOINT = 880;
