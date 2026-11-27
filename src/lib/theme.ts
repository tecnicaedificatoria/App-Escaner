import { useColorScheme } from 'react-native';

const light = {
  background: '#F4F5F7',
  card: '#FFFFFF',
  text: '#14171F',
  muted: '#6B7280',
  border: '#E3E5EA',
  primary: '#1E5EFF',
  onPrimary: '#FFFFFF',
  danger: '#D92D20',
};

const dark: typeof light = {
  background: '#0F1115',
  card: '#1A1D24',
  text: '#F2F3F5',
  muted: '#9AA1AD',
  border: '#2A2E37',
  primary: '#5B8CFF',
  onPrimary: '#FFFFFF',
  danger: '#F97066',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
