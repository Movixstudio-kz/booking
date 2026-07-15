import {
  storageFailure,
  storageSuccess,
  type StorageAdapter,
  type StorageResult,
} from "@/lib/storage";

export const schemaVersion = 1;

export const LOCAL_STORAGE_KEYS = {
  schemaVersion: "karo-booking:schema-version",
  appointments: "karo-booking:appointments",
  staff: "karo-booking:staff",
  services: "karo-booking:services",
  schedules: "karo-booking:staff-schedules",
  clients: "karo-booking:clients",
  currentUser: "karo-booking:current-user",
} as const;

export type LocalSchemaMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (storage: StorageAdapter) => StorageResult<void>;
};

function migrateFromUnversionedStorage(
  storage: StorageAdapter,
): StorageResult<void> {
  void storage;
  // Version 1 deliberately keeps every existing key and payload unchanged.
  // Repositories normalize optional legacy fields lazily while reading them.
  return storageSuccess(undefined);
}

export const migrationFunctions: readonly LocalSchemaMigration[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: migrateFromUnversionedStorage,
  },
];

export function migrateLocalSchema(
  storage: StorageAdapter,
): StorageResult<number> {
  const storedVersionResult = storage.get<unknown>(
    LOCAL_STORAGE_KEYS.schemaVersion,
  );
  if (!storedVersionResult.ok) return storedVersionResult;

  const storedVersion = storedVersionResult.data ?? 0;
  if (
    typeof storedVersion !== "number" ||
    !Number.isInteger(storedVersion) ||
    storedVersion < 0
  ) {
    return storageFailure("invalid_json");
  }

  if (storedVersion > schemaVersion) {
    return storageFailure(
      "unknown",
      new Error("The stored schema version is newer than this application."),
    );
  }

  let currentVersion = storedVersion;
  while (currentVersion < schemaVersion) {
    const migration = migrationFunctions.find(
      (candidate) => candidate.fromVersion === currentVersion,
    );
    if (!migration) {
      return storageFailure(
        "unknown",
        new Error(`Missing local schema migration from version ${currentVersion}.`),
      );
    }

    const migrationResult = migration.migrate(storage);
    if (!migrationResult.ok) return migrationResult;

    const versionWriteResult = storage.set(
      LOCAL_STORAGE_KEYS.schemaVersion,
      migration.toVersion,
    );
    if (!versionWriteResult.ok) return versionWriteResult;

    currentVersion = migration.toVersion;
  }

  return storageSuccess(currentVersion);
}
