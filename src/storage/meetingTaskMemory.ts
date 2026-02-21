import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tickspot.meeting-task-map.v1';

type MeetingTaskMap = Record<string, number>;

function normalizeMeetingNote(note: string) {
  return note.trim().toLowerCase();
}

export async function loadMeetingTaskMap(): Promise<MeetingTaskMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as MeetingTaskMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function getTaskIdForMeetingNote(note: string): Promise<number | undefined> {
  const mapping = await loadMeetingTaskMap();
  return mapping[normalizeMeetingNote(note)];
}

export async function rememberTaskForMeetingNote(note: string, taskId: number): Promise<void> {
  const normalized = normalizeMeetingNote(note);
  if (!normalized.startsWith('meeting:')) {
    return;
  }

  const mapping = await loadMeetingTaskMap();
  mapping[normalized] = taskId;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
}
