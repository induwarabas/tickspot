import notifee, { AndroidImportance, RepeatFrequency, TriggerType } from '@notifee/react-native';
import { AppSettings } from '../storage/settings';

const CHANNEL_ID = 'tickspot-reminders';
const WEEKDAYS = [1, 2, 3, 4, 5];

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function normalizeTimes(times: string[]) {
  const unique = Array.from(new Set(times.filter(isValidTime)));
  unique.sort();
  return unique;
}

function parseTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

function nextWeekdayOccurrence(weekday: number, hours: number, minutes: number, now: Date) {
  const result = new Date(now);
  const currentDay = result.getDay();
  let delta = (weekday - currentDay + 7) % 7;
  result.setHours(hours, minutes, 0, 0);
  if (delta === 0 && result <= now) {
    delta = 7;
  }
  result.setDate(result.getDate() + delta);
  return result;
}

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'TickSpot Reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function configureWeekdayReminders(settings: AppSettings) {
  if (!settings.reminderEnabled) {
    await notifee.cancelAllNotifications();
    return;
  }

  const times = normalizeTimes(settings.reminderTimes);
  if (times.length === 0) {
    await notifee.cancelAllNotifications();
    return;
  }

  await notifee.requestPermission();
  await ensureChannel();
  await notifee.cancelAllNotifications();

  const now = new Date();

  for (const weekday of WEEKDAYS) {
    for (const time of times) {
      const { hours, minutes } = parseTime(time);
      const triggerDate = nextWeekdayOccurrence(weekday, hours, minutes, now);
      await notifee.createTriggerNotification(
        {
          id: `tickspot-${weekday}-${time}`,
          title: 'Enter ticks',
          body: 'Enter ticks',
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerDate.getTime(),
          repeatFrequency: RepeatFrequency.WEEKLY,
        },
      );
    }
  }
}

export function buildReminderKey(settings: AppSettings) {
  return `${settings.reminderEnabled}-${normalizeTimes(settings.reminderTimes).join(',')}`;
}

export function validateReminderTimes(times: string[]) {
  return normalizeTimes(times);
}
