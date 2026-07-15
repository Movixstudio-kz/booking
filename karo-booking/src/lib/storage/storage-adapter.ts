export type StorageErrorCode =
  | "storage_unavailable"
  | "invalid_json"
  | "unknown";

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StorageErrorCode; cause?: unknown };

export type StorageChange = {
  key: string;
  source: "same_tab" | "cross_tab";
  operation: "set" | "remove" | "clear";
};

export type StorageSubscriber = (change: StorageChange) => void;
export type StorageLockCallback<T> = () => T | Promise<T>;

export interface StorageAdapter {
  get<T>(key: string): StorageResult<T | null>;
  set<T>(key: string, value: T): StorageResult<void>;
  remove(key: string): StorageResult<void>;
  subscribe(key: string, callback: StorageSubscriber): () => void;
  withLock<T>(key: string, callback: StorageLockCallback<T>): Promise<T>;
}

export function storageSuccess<T>(data: T): StorageResult<T> {
  return { ok: true, data };
}

export function storageFailure<T = never>(
  error: StorageErrorCode,
  cause?: unknown,
): StorageResult<T> {
  return { ok: false, error, cause };
}
