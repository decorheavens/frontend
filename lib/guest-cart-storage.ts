import type { GuestCartItem } from "./types";

const DB_NAME = "decorheavens";
const STORE_NAME = "guest-cart";
const CART_RECORD_KEY = "active";
const LEGACY_LOCAL_STORAGE_KEY = "decorheavens.guest-cart";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function readLegacyGuestCart() {
  if (typeof window === "undefined") {
    return [] as GuestCartItem[];
  }

  const rawValue = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed) ? (parsed as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function clearLegacyGuestCart() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  }
}

function openGuestCartDatabase() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  return dbPromise;
}

export async function readGuestCart() {
  const database = await openGuestCartDatabase();

  if (!database) {
    return readLegacyGuestCart();
  }

  const storedItems = await new Promise<GuestCartItem[] | null>((resolve) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(CART_RECORD_KEY);

    request.onsuccess = () => {
      resolve(Array.isArray(request.result) ? (request.result as GuestCartItem[]) : null);
    };

    request.onerror = () => {
      resolve(null);
    };
  });

  if (storedItems) {
    return storedItems;
  }

  const legacyItems = readLegacyGuestCart();

  if (legacyItems.length > 0) {
    await writeGuestCart(legacyItems);
    clearLegacyGuestCart();
    return legacyItems;
  }

  return [];
}

export async function writeGuestCart(items: GuestCartItem[]) {
  const database = await openGuestCartDatabase();

  if (!database) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(items));
    }

    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();

    store.put(items, CART_RECORD_KEY);
  });

  clearLegacyGuestCart();
}

export async function clearGuestCartStorage() {
  const database = await openGuestCartDatabase();

  if (database) {
    await new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();

      store.delete(CART_RECORD_KEY);
    });
  }

  clearLegacyGuestCart();
}
