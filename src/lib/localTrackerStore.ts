import { parseLocalTrackerState, type LocalTrackerState } from './tracker.ts';

const dbName = 'worktimer-local', storeName = 'trackerState', recordKey = 'state', legacyKey = 'worktimer.local-state.v1';
export const localModeStorageUnavailableMessage = 'Private local wymaga lokalnej pamięci IndexedDB w tej przeglądarce. Użyj Cloud sync albo innej przeglądarki.';
export const localModeLoadFailedMessage = 'Nie udało się otworzyć lokalnej pamięci Private local. Wróć do wyboru trybu albo spróbuj ponownie.';
export const localModeSaveFailedMessage = 'Nie udało się zapisać zmian w pamięci Private local. Wróć do wyboru trybu, żeby nie pracować na nieutrwalonych danych.';
type Persistence = { clearLegacy(): void; readCurrent(): Promise<string | null>; readLegacy(): string | null; writeCurrent(value: string): Promise<void> };
type IndexedDbSupport = Pick<IDBFactory, 'open'> | null;
const browserIndexedDb = () => (typeof window === 'undefined' ? null : (window.indexedDB ?? null)) as IndexedDbSupport;

const legacyStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const hasLocalModeIndexedDbSupport = (indexedDb: IndexedDbSupport = browserIndexedDb()) =>
  Boolean(indexedDb);

async function withDb<T>(
  run: (database: IDBDatabase) => Promise<T>,
  indexedDb: IndexedDbSupport = browserIndexedDb(),
) {
  if (!indexedDb) throw new Error(localModeStorageUnavailableMessage);
  const request = indexedDb.open(dbName, 1);
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onerror = () =>
      reject(request.error ?? new Error(localModeStorageUnavailableMessage));
    request.onsuccess = () => resolve(request.result);
  });
  try {
    return await run(database);
  } finally {
    database.close();
  }
}

function browserPersistence(): Persistence {
  const storage = legacyStorage();
  return {
    clearLegacy: () => storage?.removeItem(legacyKey),
    readCurrent: () =>
      withDb(
        (database) =>
          new Promise<string | null>((resolve, reject) => {
            const request = database
              .transaction(storeName, 'readonly')
              .objectStore(storeName)
              .get(recordKey);
            request.onerror = () =>
              reject(request.error ?? new Error(localModeLoadFailedMessage));
            request.onsuccess = () =>
              resolve(typeof request.result === 'string' ? request.result : null);
          }),
      ),
    readLegacy: () => storage?.getItem(legacyKey) ?? null,
    writeCurrent: (value) =>
      withDb(
        (database) =>
          new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite');
            transaction.objectStore(storeName).put(value, recordKey);
            transaction.onerror = () =>
              reject(transaction.error ?? new Error(localModeSaveFailedMessage));
            transaction.oncomplete = () => resolve();
          }),
      ),
  };
}

export async function loadPersistedLocalTrackerState(
  persistence: Persistence = browserPersistence(),
) {
  const current = await persistence.readCurrent();
  if (current !== null) {
    const parsed = parseLocalTrackerState(current);
    if (parsed) return parsed;
    const legacy = parseLocalTrackerState(persistence.readLegacy());
    if (!legacy) throw new Error(localModeLoadFailedMessage);
    await persistence.writeCurrent(JSON.stringify(legacy));
    persistence.clearLegacy();
    return legacy;
  }
  const legacy = parseLocalTrackerState(persistence.readLegacy());
  if (!legacy) return null;
  await persistence.writeCurrent(JSON.stringify(legacy));
  persistence.clearLegacy();
  return legacy;
}

export const savePersistedLocalTrackerState = (
  state: LocalTrackerState,
  persistence: Persistence = browserPersistence(),
) => persistence.writeCurrent(JSON.stringify(state));
