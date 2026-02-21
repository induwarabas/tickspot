import RNCalendarEvents from 'react-native-calendar-events';

export type SuggestedCalendarEntry = {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  hours: number;
  date: string;
};

const HOURS_STEP = 1 / 12;

function roundTo5Minutes(hours: number) {
  const rounded = Math.round(hours / HOURS_STEP) * HOURS_STEP;
  return Number(Math.max(0, rounded).toFixed(4));
}

function parseDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function buildDayRange(dateValue: string) {
  const start = parseDate(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = parseDate(dateValue);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatHoursLabel(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;
  return `${hoursPart}h ${minutesPart.toString().padStart(2, '0')}m`;
}

export async function getCalendarSuggestions(dateValue: string): Promise<SuggestedCalendarEntry[]> {
  const permission = await RNCalendarEvents.requestPermissions(false);
  if (permission !== 'authorized') {
    return [];
  }

  const { start, end } = buildDayRange(dateValue);
  const events = await RNCalendarEvents.fetchAllEvents(start, end);

  return events
    .filter((event) => Boolean(event.startDate) && Boolean(event.endDate))
    .filter((event) => !event.allDay)
    .filter((event) => {
      const title = event.title?.toLowerCase() ?? '';
      return !title.includes('birthday');
    })
    .map((event) => {
      const startDate = new Date(event.startDate as string);
      const endDate = new Date(event.endDate as string);
      const durationHoursRaw = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const durationHours = event.allDay ? 1 : roundTo5Minutes(durationHoursRaw > 0 ? durationHoursRaw : 1);
      const title = event.title?.trim() || 'Calendar Event';
      const note = `Meeting: ${title}`;

      return {
        id: `${event.id}-${startDate.toISOString()}`,
        title,
        subtitle: `Suggested from calendar • ${formatHoursLabel(durationHours)}`,
        note,
        hours: durationHours,
        date: dateValue,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}
