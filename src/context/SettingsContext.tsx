import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppSettings, buildDefaultSettings, loadSettings, saveSettings } from '../storage/settings';

export type SettingsContextValue = {
  settings: AppSettings;
  isReady: boolean;
  save: (next: AppSettings) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(buildDefaultSettings());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadSettings()
      .then((stored) => {
        if (isMounted) {
          setSettings(stored);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSettings(buildDefaultSettings());
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const save = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isReady,
      save,
    }),
    [settings, isReady, save],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
