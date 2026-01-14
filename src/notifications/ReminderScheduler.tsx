import React, { useEffect, useMemo, useState } from 'react';
import { buildReminderKey, configureWeekdayReminders } from './reminders';
import { useSettings } from '../context/SettingsContext';

export default function ReminderScheduler() {
  const { settings, isReady } = useSettings();
  const key = useMemo(() => buildReminderKey(settings), [settings]);
  const [lastKey, setLastKey] = useState('');

  useEffect(() => {
    if (!isReady || key === lastKey) {
      return;
    }
    setLastKey(key);
    configureWeekdayReminders(settings).catch(() => {
      // Settings screen will surface errors during save.
    });
  }, [isReady, key, lastKey, settings]);

  return null;
}
