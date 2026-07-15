import { LocalStorageAppointmentRepository } from "@/features/appointments/repositories";
import { LocalStorageClientRepository } from "@/features/clients/repositories";
import { LocalStorageScheduleRepository } from "@/features/schedule/repositories";
import { LocalStorageServiceRepository } from "@/features/services/repositories";
import { LocalStorageStaffRepository } from "@/features/staff/repositories";
import {
  browserStorageAdapter,
  storageSuccess,
  type StorageAdapter,
  type StorageResult,
  type StorageLockCallback,
  type StorageSubscriber,
} from "@/lib/storage";
import { LOCAL_STORAGE_KEYS, migrateLocalSchema } from "@/repositories/local-schema";
import { DEFAULT_ORGANIZATION_ID } from "@/repositories/tenant-context";
import type { RepositoryContext } from "@/repositories/types";
import type { CurrentUser } from "@/types/roles";

export const LOCAL_ORGANIZATION_ID = DEFAULT_ORGANIZATION_ID;

class SchemaAwareStorageAdapter implements StorageAdapter {
  constructor(private readonly storage: StorageAdapter) {}

  get<T>(key: string): StorageResult<T | null> {
    const initialization = this.ensureSchema(key);
    if (!initialization.ok) return initialization;
    return this.storage.get<T>(key);
  }

  set<T>(key: string, value: T): StorageResult<void> {
    const initialization = this.ensureSchema(key);
    if (!initialization.ok) return initialization;
    return this.storage.set(key, value);
  }

  remove(key: string): StorageResult<void> {
    const initialization = this.ensureSchema(key);
    if (!initialization.ok) return initialization;
    return this.storage.remove(key);
  }

  subscribe(key: string, callback: StorageSubscriber): () => void {
    return this.storage.subscribe(key, callback);
  }

  withLock<T>(key: string, callback: StorageLockCallback<T>): Promise<T> {
    return this.storage.withLock(key, callback);
  }

  private ensureSchema(key: string): StorageResult<void> {
    if (key === LOCAL_STORAGE_KEYS.schemaVersion) return storageSuccess(undefined);
    const result = migrateLocalSchema(this.storage);
    return result.ok ? storageSuccess(undefined) : result;
  }
}

const storage = new SchemaAwareStorageAdapter(browserStorageAdapter);
const appointments = new LocalStorageAppointmentRepository(storage);
const staff = new LocalStorageStaffRepository(storage);
const services = new LocalStorageServiceRepository(storage);
const clients = new LocalStorageClientRepository(storage);
const schedules = new LocalStorageScheduleRepository(appointments, staff, storage);

export const repositories = Object.freeze({
  appointments,
  staff,
  services,
  clients,
  schedules,
});

export function createRepositoryContext(user: CurrentUser): RepositoryContext {
  return {
    organizationId: LOCAL_ORGANIZATION_ID,
    currentUserId: user.id,
    currentRole: user.role,
    staffId: user.staffId ?? null,
    accessMode: "authenticated",
  };
}

export const publicBookingContext: RepositoryContext = Object.freeze({
  organizationId: LOCAL_ORGANIZATION_ID,
  currentUserId: "public-booking",
  currentRole: "viewer",
  staffId: null,
  accessMode: "public_booking",
});
