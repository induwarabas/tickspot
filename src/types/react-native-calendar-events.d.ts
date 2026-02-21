declare module 'react-native-calendar-events' {
  type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined';

  type CalendarEvent = {
    id?: string;
    title?: string;
    notes?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    allDay?: boolean;
  };

  const RNCalendarEvents: {
    requestPermissions(readOnly?: boolean): Promise<PermissionStatus>;
    fetchAllEvents(startDate: string, endDate: string): Promise<CalendarEvent[]>;
  };

  export default RNCalendarEvents;
}
