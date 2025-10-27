import type { Carpet } from '../types';

const DB_NAME = 'CarpetCatalogDB';
const DB_VERSION = 1;
const STORE_NAME = 'carpets';

let db: IDBDatabase | null = null;

// Function to initialize and open the database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database.');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Generic request wrapper to simplify DB operations
const performDbRequest = <T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = operation(store);

            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => {
                console.error('DB Request Error:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getAllCarpets = (): Promise<Carpet[]> => {
    return performDbRequest<Carpet[]>(STORE_NAME, 'readonly', store => store.getAll());
};

export const addCarpetDB = (carpet: Carpet): Promise<IDBValidKey> => {
    return performDbRequest<IDBValidKey>(STORE_NAME, 'readwrite', store => store.add(carpet));
};

export const updateCarpetDB = (carpet: Carpet): Promise<IDBValidKey> => {
    return performDbRequest<IDBValidKey>(STORE_NAME, 'readwrite', store => store.put(carpet));
};

export const deleteCarpetDB = (carpetId: string): Promise<void> => {
    return performDbRequest<void>(STORE_NAME, 'readwrite', store => store.delete(carpetId));
};

export const replaceAllCarpetsDB = (carpets: Carpet[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.clear();

      for (const carpet of carpets) {
        store.put(carpet);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    } catch (error) {
      reject(error);
    }
  });
};