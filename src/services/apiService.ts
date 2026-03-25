import { getToken, clearAuth } from './authService';

const API_BASE = '/api';

/**
 * Get headers with auth token
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

/**
 * Generic fetch wrapper
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

// ==================== SUBJECTS ====================

export interface Subject {
  id: string;
  userId: string;
  name: string;
  orderNum?: number;
  createdAt: string;
  updatedAt: string;
}

export async function getSubjects(): Promise<Subject[]> {
  return fetchApi<Subject[]>('/subjects');
}

export async function createSubject(data: { name: string; orderNum?: number }): Promise<Subject> {
  return fetchApi<Subject>('/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubject(id: string, data: { name: string; orderNum?: number }): Promise<Subject> {
  return fetchApi<Subject>(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSubject(id: string): Promise<void> {
  await fetchApi(`/subjects/${id}`, {
    method: 'DELETE',
  });
}

// ==================== TOPICS ====================

export interface Topic {
  id: string;
  userId: string;
  subjectId: string;
  name: string;
  orderNum?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getTopics(subjectId?: string): Promise<Topic[]> {
  const query = subjectId ? `?subjectId=${subjectId}` : '';
  return fetchApi<Topic[]>(`/topics${query}`);
}

export async function createTopic(data: {
  subjectId: string;
  name: string;
  orderNum?: number;
  description?: string;
}): Promise<Topic> {
  return fetchApi<Topic>('/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTopic(
  id: string,
  data: { name: string; orderNum?: number; description?: string }
): Promise<Topic> {
  return fetchApi<Topic>(`/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTopic(id: string): Promise<void> {
  await fetchApi(`/topics/${id}`, {
    method: 'DELETE',
  });
}

// ==================== SETTINGS ====================

export interface Settings {
  userId: string;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  dailyGoalMinutes: number;
  enableSounds: boolean;
  theme: 'dark' | 'light';
}

export async function getSettings(): Promise<Settings> {
  return fetchApi<Settings>('/settings');
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  return fetchApi<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== SYNC ====================

export interface SyncData {
  subjects: Subject[];
  topics: Topic[];
  subtopics?: any[];
  notes?: any[];
  questions?: any[];
  studySessions?: any[];
  reviewSchedules?: any[];
  reviewAttempts?: any[];
  questionHistory?: any[];
  activityPlanItems?: any[];
  settings?: any;
  syncedAt: string;
}

export async function syncData(lastSync?: string): Promise<SyncData> {
  const query = lastSync ? `?lastSync=${lastSync}` : '';
  return fetchApi<SyncData>(`/sync${query}`);
}

export async function pushData(data: Partial<SyncData>): Promise<{ synced: number; syncedAt: string }> {
  return fetchApi<{ synced: number; syncedAt: string }>('/sync', {
    method: 'POST',
    body: JSON.stringify(data),
    keepalive: true, // Crucial for incognito/closing tab sync
  });
}
