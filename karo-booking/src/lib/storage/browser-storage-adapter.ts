import {
  storageFailure,
  storageSuccess,
  type StorageAdapter,
  type StorageChange,
  type StorageLockCallback,
  type StorageResult,
  type StorageSubscriber,
} from "./storage-adapter";

export class BrowserStorageAdapter implements StorageAdapter {
  private readonly subscribers = new Map<string, Set<StorageSubscriber>>();
  private readonly fallbackLocks = new Map<string, Promise<void>>();
  private isListeningForStorageEvents = false;

  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === null) {
      for (const key of this.subscribers.keys()) {
        this.notify({ key, source: "cross_tab", operation: "clear" });
      }
      return;
    }

    this.notify({
      key: event.key,
      source: "cross_tab",
      operation: event.newValue === null ? "remove" : "set",
    });
  };

  get<T>(key: string): StorageResult<T | null> {
    const storage = this.getStorage();
    if (!storage) return storageFailure("storage_unavailable");

    let rawValue: string | null;
    try {
      rawValue = storage.getItem(key);
    } catch (cause) {
      return storageFailure("storage_unavailable", cause);
    }

    if (rawValue === null) return storageSuccess(null);

    try {
      return storageSuccess(JSON.parse(rawValue) as T);
    } catch (cause) {
      return storageFailure("invalid_json", cause);
    }
  }

  set<T>(key: string, value: T): StorageResult<void> {
    const storage = this.getStorage();
    if (!storage) return storageFailure("storage_unavailable");

    let serializedValue: string | undefined;
    try {
      serializedValue = JSON.stringify(value);
    } catch (cause) {
      return storageFailure("unknown", cause);
    }

    if (serializedValue === undefined) {
      return storageFailure(
        "unknown",
        new TypeError("The storage value is not JSON-serializable."),
      );
    }

    try {
      storage.setItem(key, serializedValue);
    } catch (cause) {
      return storageFailure("storage_unavailable", cause);
    }

    this.notify({ key, source: "same_tab", operation: "set" });
    return storageSuccess(undefined);
  }

  remove(key: string): StorageResult<void> {
    const storage = this.getStorage();
    if (!storage) return storageFailure("storage_unavailable");

    try {
      storage.removeItem(key);
    } catch (cause) {
      return storageFailure("storage_unavailable", cause);
    }

    this.notify({ key, source: "same_tab", operation: "remove" });
    return storageSuccess(undefined);
  }

  subscribe(key: string, callback: StorageSubscriber): () => void {
    const subscribersForKey = this.subscribers.get(key) ?? new Set();
    subscribersForKey.add(callback);
    this.subscribers.set(key, subscribersForKey);
    this.startListeningForStorageEvents();

    return () => {
      const currentSubscribers = this.subscribers.get(key);
      currentSubscribers?.delete(callback);

      if (currentSubscribers?.size === 0) {
        this.subscribers.delete(key);
      }

      if (this.subscribers.size === 0) {
        this.stopListeningForStorageEvents();
      }
    };
  }

  async withLock<T>(
    key: string,
    callback: StorageLockCallback<T>,
  ): Promise<T> {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return navigator.locks.request(
        `karo-booking:${key}`,
        async () => callback(),
      );
    }

    const previous = this.fallbackLocks.get(key) ?? Promise.resolve();
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => gate);
    this.fallbackLocks.set(key, tail);
    await previous;

    try {
      return await callback();
    } finally {
      release();
      if (this.fallbackLocks.get(key) === tail) {
        this.fallbackLocks.delete(key);
      }
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") return null;

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private notify(change: StorageChange): void {
    const subscribersForKey = this.subscribers.get(change.key);
    if (!subscribersForKey) return;

    for (const subscriber of [...subscribersForKey]) {
      try {
        subscriber(change);
      } catch {
        // A failing subscriber must not interrupt persistence or other listeners.
      }
    }
  }

  private startListeningForStorageEvents(): void {
    if (typeof window === "undefined" || this.isListeningForStorageEvents) return;
    window.addEventListener("storage", this.handleStorageEvent);
    this.isListeningForStorageEvents = true;
  }

  private stopListeningForStorageEvents(): void {
    if (typeof window === "undefined" || !this.isListeningForStorageEvents) return;
    window.removeEventListener("storage", this.handleStorageEvent);
    this.isListeningForStorageEvents = false;
  }
}

export const browserStorageAdapter: StorageAdapter =
  new BrowserStorageAdapter();
