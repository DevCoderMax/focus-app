import * as storage from '@/data/storage';
import * as api from './apiService';
import { getToken } from './authService';

const LAST_SYNC_KEY = 'focus.lastSync';

/**
 * Get last sync timestamp
 */
export function getLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Set last sync timestamp
 */
export function setLastSync(timestamp: string): void {
  localStorage.setItem(LAST_SYNC_KEY, timestamp);
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync data from server to local
 */
export async function pullFromServer(): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const lastSync = getLastSync();
    const serverData: any = await api.syncData(lastSync || undefined);

    const stores: (any)[] = [
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
      'settings',
    ];

    for (const store of stores) {
      const items = serverData[store];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.deletedAt) {
            // If deleted on server, remove locally
            await storage.hardRemove(store, item.id);
          } else {
            // Update or add locally (respect local soft-delete)
            const existing = await storage.getRawById(store, item.id);
            if (!existing || new Date(item.updatedAt) > new Date((existing as any).updatedAt)) {
              // Only update if local is NOT soft-deleted
              if (!existing || !(existing as any).deletedAt) {
                await storage.put(store, item);
              }
            }
          }
        }
      }
 else if (store === 'settings' && serverData.settings) {
        // Special case for settings if not an array
        const settings = serverData.settings;
        const existing = await storage.getSettings();
        if (new Date(settings.updatedAt) > new Date((existing as any).updatedAt)) {
          await storage.updateSettings(settings);
        }
      }
    }

    // Update last sync with server time
    setLastSync(serverData.syncedAt);
  } catch (error) {
    console.error('Sync pull error:', error);
    throw error;
  }
}

/**
 * Push local changes to server
 */
export async function pushToServer(): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const lastSync = getLastSync();
    const syncData = await storage.getSyncData(lastSync);

    // Push to server
    const result = await api.pushData(syncData as any);

    // If successful, hard remove locally deleted items that were synced
    for (const [store, items] of Object.entries(syncData)) {
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.deletedAt) {
            await storage.hardRemove(store as any, item.id);
          }
        }
      }
    }

    // Update last sync with server time
    setLastSync(result.syncedAt);
  } catch (error) {
    console.error('Sync push error:', error);
    throw error;
  }
}

/**
 * Full sync (push then pull)
 */
export async function fullSync(): Promise<void> {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  try {
    // 1. Push local changes first so server knows about our deletions
    await pushToServer();
    // 2. Pull remote changes
    await pullFromServer();
  } catch (error) {
    console.error('Full sync error:', error);
    throw error;
  }
}

/**
 * Initialize sync listeners
 */
export function initSyncListeners(): void {
  // Sync when coming online
  window.addEventListener('online', () => {
    console.log('Back online - syncing...');
    fullSync().catch(console.error);
  });

  // Log when going offline
  window.addEventListener('offline', () => {
    console.log('Gone offline - changes will sync when back online');
  });
}
