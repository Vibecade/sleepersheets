interface PersistentCacheRecord<T> {
  key: string;
  value: T;
  updatedAt: number;
}

const DB_NAME = 'sleepersheets-cache';
const DB_VERSION = 1;
const STORE_NAME = 'app-cache';

const isIndexedDbAvailable = () =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openPersistentCacheDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open persistent cache database.'));
  });
};

export const getPersistentCacheValue = async <T>(key: string): Promise<T | null> => {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  const db = await openPersistentCacheDb();

  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as PersistentCacheRecord<T> | undefined;
        resolve(record?.value ?? null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to read persistent cache key: ${key}`));
    });
  } finally {
    db.close();
  }
};

export const setPersistentCacheValue = async <T>(key: string, value: T): Promise<void> => {
  if (!isIndexedDbAvailable()) {
    return;
  }

  const db = await openPersistentCacheDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        key,
        value,
        updatedAt: Date.now(),
      } as PersistentCacheRecord<T>);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to write persistent cache key: ${key}`));
    });
  } finally {
    db.close();
  }
};

export const removePersistentCacheValue = async (key: string): Promise<void> => {
  if (!isIndexedDbAvailable()) {
    return;
  }

  const db = await openPersistentCacheDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error(`Failed to delete persistent cache key: ${key}`));
    });
  } finally {
    db.close();
  }
};
