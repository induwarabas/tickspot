import { useColorScheme } from 'react-native';

export type AppTheme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    danger: string;
    dangerSoft: string;
    infoSoft: string;
    successSoft: string;
    successText: string;
    warningSoft: string;
    shadow: string;
    overlay: string;
  };
};

const lightColors: AppTheme['colors'] = {
  background: '#f7f5f0',
  surface: '#ffffff',
  surfaceAlt: '#f0ede6',
  border: '#e3ded4',
  textPrimary: '#1f2933',
  textSecondary: '#3e4c59',
  textMuted: '#8c8577',
  primary: '#1f2933',
  primaryText: '#f9f5ee',
  danger: '#b42318',
  dangerSoft: '#fde2e2',
  infoSoft: '#e6f4ff',
  successSoft: '#ecfdf3',
  successText: '#067647',
  warningSoft: '#fce8e6',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.3)',
};

const darkColors: AppTheme['colors'] = {
  background: '#0f141b',
  surface: '#151d27',
  surfaceAlt: '#1b2531',
  border: '#2d3846',
  textPrimary: '#e8edf4',
  textSecondary: '#c4cfdd',
  textMuted: '#94a3b8',
  primary: '#e8edf4',
  primaryText: '#0f141b',
  danger: '#f97066',
  dangerSoft: '#3a1f23',
  infoSoft: '#1f2a3a',
  successSoft: '#12332a',
  successText: '#6ce9a6',
  warningSoft: '#402629',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
};

export function useAppTheme(): AppTheme {
  const isDark = useColorScheme() === 'dark';
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
