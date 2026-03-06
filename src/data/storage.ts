import { openDB, IDBPDatabase } from 'idb';
import type {
  Subject,
  Topic,
  Note,
  Question,
  StudySession,
  ReviewSchedule,
  ReviewAttempt,
  Settings,
  QuestionHistoryEntry,
  ActivityPlanItem,
} from '@/types';

const DB_NAME = 'focus-db';
const PROFILE_KEY = 'focus.activeProfile';
const DB_VERSION = 4;

export interface FocusDB {
  subjects: { key: string; value: Subject };
  topics: { key: string; value: Topic };
  subtopics: { key: string; value: import('@/types').Subtopic };
  notes: { key: string; value: Note };
  questions: { key: string; value: Question };
  studySessions: { key: string; value: StudySession };
  reviewSchedules: { key: string; value: ReviewSchedule };
  reviewAttempts: { key: string; value: ReviewAttempt };
  questionHistory: { key: string; value: QuestionHistoryEntry };
  activityPlanItems: { key: string; value: ActivityPlanItem };
  settings: { key: string; value: Settings };
}

let dbInstance: IDBPDatabase<FocusDB> | null = null;
let dbProfileId: string | null = null;

function getProfileId(): string {
  return window.localStorage.getItem(PROFILE_KEY) || 'default';
}

function getProfileDbName(profileId: string): string {
  return `${DB_NAME}-${profileId}`;
}

export async function getAllFromProfile<T extends keyof FocusDB>(
  profileId: string,
  storeName: T
): Promise<FocusDB[T]['value'][]> {
  const db = await openDB<FocusDB>(getProfileDbName(profileId), DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('topics')) {
        const topicStore = db.createObjectStore('topics', { keyPath: 'id' });
        topicStore.createIndex('subjectId', 'subjectId');
      }
      if (!db.objectStoreNames.contains('subtopics')) {
        const subtopicStore = db.createObjectStore('subtopics', { keyPath: 'id' });
        subtopicStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('questions')) {
        const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
        questionStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('studySessions')) {
        const sessionStore = db.createObjectStore('studySessions', { keyPath: 'id' });
        sessionStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('reviewSchedules')) {
        const scheduleStore = db.createObjectStore('reviewSchedules', { keyPath: 'id' });
        scheduleStore.createIndex('topicId', 'topicId');
        scheduleStore.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('reviewAttempts')) {
        const attemptStore = db.createObjectStore('reviewAttempts', { keyPath: 'id' });
        attemptStore.createIndex('scheduleId', 'scheduleId');
      }
      if (!db.objectStoreNames.contains('questionHistory')) {
        const historyStore = db.createObjectStore('questionHistory', { keyPath: 'id' });
        historyStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('activityPlanItems')) {
        const planStore = db.createObjectStore('activityPlanItems', { keyPath: 'id' });
        planStore.createIndex('topicId', 'topicId');
        planStore.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  return db.getAll(storeName);
}

export function setActiveProfile(profileId: string): void {
  window.localStorage.setItem(PROFILE_KEY, profileId);
  dbInstance = null;
  dbProfileId = null;
}

export async function initDB(): Promise<IDBPDatabase<FocusDB>> {
  const profileId = getProfileId();
  if (dbInstance && dbProfileId === profileId) return dbInstance;

  dbInstance = await openDB<FocusDB>(getProfileDbName(profileId), DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('topics')) {
        const topicStore = db.createObjectStore('topics', { keyPath: 'id' });
        topicStore.createIndex('subjectId', 'subjectId');
      }
      if (!db.objectStoreNames.contains('subtopics')) {
        const subtopicStore = db.createObjectStore('subtopics', { keyPath: 'id' });
        subtopicStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('questions')) {
        const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
        questionStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('studySessions')) {
        const sessionStore = db.createObjectStore('studySessions', { keyPath: 'id' });
        sessionStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('reviewSchedules')) {
        const scheduleStore = db.createObjectStore('reviewSchedules', { keyPath: 'id' });
        scheduleStore.createIndex('topicId', 'topicId');
        scheduleStore.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('reviewAttempts')) {
        const attemptStore = db.createObjectStore('reviewAttempts', { keyPath: 'id' });
        attemptStore.createIndex('scheduleId', 'scheduleId');
      }
      if (!db.objectStoreNames.contains('questionHistory')) {
        const historyStore = db.createObjectStore('questionHistory', { keyPath: 'id' });
        historyStore.createIndex('topicId', 'topicId');
      }
      if (!db.objectStoreNames.contains('activityPlanItems')) {
        const planStore = db.createObjectStore('activityPlanItems', { keyPath: 'id' });
        planStore.createIndex('topicId', 'topicId');
        planStore.createIndex('status', 'status');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  dbProfileId = profileId;

  return dbInstance;
}

// Generic CRUD operations
export async function getAll<T extends keyof FocusDB>(
  storeName: T
): Promise<FocusDB[T]['value'][]> {
  const db = await initDB();
  return db.getAll(storeName);
}

export async function getById<T extends keyof FocusDB>(
  storeName: T,
  id: string
): Promise<FocusDB[T]['value'] | undefined> {
  const db = await initDB();
  return db.get(storeName, id);
}

export async function add<T extends keyof FocusDB>(
  storeName: T,
  item: FocusDB[T]['value']
): Promise<string> {
  const db = await initDB();
  return db.add(storeName, item as any) as Promise<string>;
}

export async function put<T extends keyof FocusDB>(
  storeName: T,
  item: FocusDB[T]['value']
): Promise<string> {
  const db = await initDB();
  return db.put(storeName, item as any) as Promise<string>;
}

export async function remove<T extends keyof FocusDB>(
  storeName: T,
  id: string
): Promise<void> {
  const db = await initDB();
  return db.delete(storeName, id);
}

export async function getByIndex<T extends keyof FocusDB>(
  storeName: T,
  indexName: string,
  key: string
): Promise<FocusDB[T]['value'][]> {
  const db = await initDB();
  return db.getAllFromIndex(storeName, indexName, key);
}

// Clear all data
export async function clearAll(): Promise<void> {
  const db = await initDB();
  const stores: (keyof FocusDB)[] = [
    'subjects',
    'topics',
    'subtopics',
    'notes',
    'questions',
    'studySessions',
    'reviewSchedules',
    'reviewAttempts',
    'questionHistory',
    'activityPlanItems',
  ];

  const tx = db.transaction(stores, 'readwrite');
  await Promise.all(stores.map((store) => tx.objectStore(store).clear()));
  await tx.done;
}

// Initialize default settings
export async function initSettings(): Promise<void> {
  const db = await initDB();
  const existing = await db.get('settings', 'default');

  if (!existing) {
    const defaultSettings: Settings = {
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      dailyGoalMinutes: 120,
      enableSounds: true,
      theme: 'dark',
    };

    await db.put('settings', { ...defaultSettings, id: 'default' } as any);
  }
}

export async function getSettings(): Promise<Settings> {
  const db = await initDB();
  const settings = await db.get('settings', 'default');

  if (!settings) {
    await initSettings();
    return getSettings();
  }

  return settings as Settings;
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const db = await initDB();
  const current = await getSettings();
  await db.put('settings', { ...current, ...settings, id: 'default' } as any);
}
