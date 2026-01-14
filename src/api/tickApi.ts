import { AppSettings } from '../storage/settings';

export type TickEntry = {
  id: number;
  date: string;
  hours: number | string;
  notes?: string;
  task_id?: number;
  project_id?: number;
};

export type EntryPayload = {
  date: string;
  hours: number;
  notes?: string;
  task_id?: number;
  project_id?: number;
};

export type TickProject = {
  id: number;
  name: string;
  client_id?: number;
};

export type TickTask = {
  id: number;
  name: string;
  project_id?: number;
};

export type TickClient = {
  id: number;
  name: string;
};

function buildHeaders(apiKey: string) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Token token=${apiKey}`,
    'User-Agent': 'TickSpotMobile/1.0 (admin@yaalalabs.com)',
  };
}

async function request<T>(
  settings: AppSettings,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}${path}`;
  console.log(url, JSON.stringify(options));

  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(settings.apiKey),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    let detail = '';
    if (typeof data === 'string') {
      detail = data;
    } else if (data && typeof data === 'object') {
      detail = JSON.stringify(data);
    }

    const statusLine = `${response.status} ${response.statusText}`.trim();
    const message = detail
      ? `Request failed (${statusLine}): ${detail}`
      : `Request failed (${statusLine}).`;
    throw new Error(message);
  }

  return data as T;
}

export async function getEntriesByDate(
  settings: AppSettings,
  date: string,
): Promise<TickEntry[]> {
  const encoded = encodeURIComponent(date);
  return request<TickEntry[]>(
    settings,
    `/entries.json?start_date=${encoded}&end_date=${encoded}`,
  );
}

export async function createEntry(settings: AppSettings, payload: EntryPayload): Promise<TickEntry> {
  const result = await request<TickEntry | null>(settings, '/entries.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!result || typeof result !== 'object' || !('id' in result)) {
    throw new Error('Create failed: unexpected response from server.');
  }
  return result as TickEntry;
}

export async function updateEntry(
  settings: AppSettings,
  id: number,
  payload: EntryPayload,
): Promise<TickEntry> {
  const result = await request<TickEntry | null>(settings, `/entries/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!result || typeof result !== 'object' || !('id' in result)) {
    throw new Error('Update failed: unexpected response from server.');
  }
  return result as TickEntry;
}

export async function deleteEntry(settings: AppSettings, id: number): Promise<void> {
  await request<void>(settings, `/entries/${id}.json`, {
    method: 'DELETE',
  });
}

export async function getProjects(settings: AppSettings): Promise<TickProject[]> {
  return request<TickProject[]>(settings, '/projects.json');
}

export async function getTasks(settings: AppSettings): Promise<TickTask[]> {
  return request<TickTask[]>(settings, '/tasks.json');
}

export async function getClients(settings: AppSettings): Promise<TickClient[]> {
  return request<TickClient[]>(settings, '/clients.json');
}
