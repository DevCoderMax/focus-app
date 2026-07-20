import type {
  ActivityPlanItem,
  Goal,
  GoalsAnalytics,
  Profile,
  Question,
  QuestionHistoryEntry,
  ReviewAttempt,
  ReviewSchedule,
  Settings,
  StudySession,
  Subject,
  Subtopic,
  Topic,
} from '@/types';

const API_BASE = '/api';
const ACTIVE_PROFILE_KEY = 'focus.activeProfile';

export interface AppStateData {
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  notes: import('@/types').Note[];
  questions: Question[];
  studySessions: StudySession[];
  reviewSchedules: ReviewSchedule[];
  reviewAttempts: ReviewAttempt[];
  questionHistory: QuestionHistoryEntry[];
  activityPlanItems: ActivityPlanItem[];
  goals: Goal[];
  settings: Settings;
  profiles: Profile[];
  activeProfileId: string;
  completedTopics: string[];
  completedSubtopics: string[];
}

export type ResourceName =
  | 'subjects'
  | 'topics'
  | 'subtopics'
  | 'notes'
  | 'questions'
  | 'study-sessions'
  | 'review-schedules'
  | 'review-attempts'
  | 'question-history'
  | 'activity-plan-items'
  | 'goals';

export type ResourceValue =
  | Subject
  | Topic
  | Subtopic
  | import('@/types').Note
  | Question
  | StudySession
  | ReviewSchedule
  | ReviewAttempt
  | QuestionHistoryEntry
  | ActivityPlanItem
  | Goal;

export function getActiveProfileId(): string | null {
  return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(profileId: string): void {
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const activeProfileId = getActiveProfileId();
  if (activeProfileId) {
    headers['X-Profile-Id'] = activeProfileId;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || 'Erro na requisição');
  }
  return data as T;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

export async function getAppState(): Promise<AppStateData> {
  return fetchApi<AppStateData>('/app-state');
}

export async function getAppStateForProfile(profileId: string): Promise<AppStateData> {
  return fetchApi<AppStateData>('/app-state', {
    headers: { 'X-Profile-Id': profileId },
  });
}

export async function listProfiles(): Promise<Profile[]> {
  return fetchApi<Profile[]>('/profiles');
}

export async function createProfile(data: { name: string; avatar?: string }): Promise<Profile> {
  return fetchApi<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  return fetchApi<Profile>(`/profiles/${profile.id}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function deleteProfile(id: string): Promise<void> {
  await fetchApi(`/profiles/${id}`, { method: 'DELETE' });
}

export async function createResource<T extends ResourceValue>(resource: ResourceName, item: T): Promise<T> {
  return fetchApi<T>(`/${resource}`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateResource<T extends ResourceValue>(resource: ResourceName, item: T): Promise<T> {
  return fetchApi<T>(`/${resource}/${item.id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function deleteResource(resource: ResourceName, id: string): Promise<void> {
  await fetchApi(`/${resource}/${id}`, { method: 'DELETE' });
}

export async function reorderResource<T extends ResourceValue>(resource: ResourceName, ids: string[]): Promise<T[]> {
  return fetchApi<T[]>(`/${resource}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  return fetchApi<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function setCompletedItem(
  itemType: 'topic' | 'subtopic',
  itemId: string,
  completed: boolean
): Promise<{ completedTopics: string[]; completedSubtopics: string[] }> {
  return fetchApi(`/completed-items/${itemType}/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
}

export async function importBackup(mode: 'replace' | 'merge', data: unknown): Promise<void> {
  await fetchApi('/data/import', {
    method: 'POST',
    body: JSON.stringify({ mode, data }),
  });
}


export async function getGoalsAnalytics(): Promise<GoalsAnalytics> {
  return fetchApi<GoalsAnalytics>('/goals/analytics');
}
