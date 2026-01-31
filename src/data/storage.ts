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
} from '@/types';

const DB_NAME = 'focus-db';
const DB_VERSION = 1;

export interface FocusDB {
  subjects: { key: string; value: Subject };
  topics: { key: string; value: Topic };
  notes: { key: string; value: Note };
  questions: { key: string; value: Question };
  studySessions: { key: string; value: StudySession };
  reviewSchedules: { key: string; value: ReviewSchedule };
  reviewAttempts: { key: string; value: ReviewAttempt };
  settings: { key: string; value: Settings };
}

let dbInstance: IDBPDatabase<FocusDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<FocusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FocusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('topics')) {
        const topicStore = db.createObjectStore('topics', { keyPath: 'id' });
        topicStore.createIndex('subjectId', 'subjectId');
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
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

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
    'notes',
    'questions',
    'studySessions',
    'reviewSchedules',
    'reviewAttempts',
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
