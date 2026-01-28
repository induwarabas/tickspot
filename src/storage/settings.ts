import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppSettings = {
  apiKey: string;
  baseUrl: string;
  reminderEnabled: boolean;
  reminderTimes: string[];
};

const SETTINGS_KEY = 'tickspot.settings.v1';
const DEFAULT_BASE_URL = 'https://yaala-labs.tickspot.com/108063/api/v2';

export function buildDefaultSettings(): AppSettings {
  return {
    apiKey: '',
    baseUrl: DEFAULT_BASE_URL,
    reminderEnabled: true,
    reminderTimes: ['10:00', '17:00', '21:00'],
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
      reminderEnabled: parsed.reminderEnabled ?? true,
      reminderTimes: Array.isArray(parsed.reminderTimes)
        ? parsed.reminderTimes.filter((value) => typeof value === 'string')
        : ['10:00', '17:00', '21:00'],
    };
  } catch (error) {
    return buildDefaultSettings();
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
