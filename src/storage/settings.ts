import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppSettings = {
  apiKey: string;
  baseUrl: string;
};

const SETTINGS_KEY = 'tickspot.settings.v1';
const DEFAULT_BASE_URL = 'https://yaala-labs.tickspot.com/api/v2';

export function buildDefaultSettings(): AppSettings {
  return {
    apiKey: '',
    baseUrl: DEFAULT_BASE_URL,
  };
}

export async function loadSettings(): Promise<AppSettings> {
  const stored = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return buildDefaultSettings();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      apiKey: parsed.apiKey ?? '',
      baseUrl: parsed.baseUrl ?? DEFAULT_BASE_URL,
    };
  } catch (error) {
    return buildDefaultSettings();
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
