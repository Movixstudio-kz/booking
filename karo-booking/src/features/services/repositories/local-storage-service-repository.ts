import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";
import type { StorageAdapter } from "@/lib/storage";
import { canManageServices } from "@/lib/permissions";
import { LOCAL_STORAGE_KEYS } from "@/repositories/local-schema";
import { repositoryContextToCurrentUser } from "@/repositories/repository-context";
import { repositoryFailureFromStorage } from "@/repositories/repository-storage-error";
import {
  filterByOrganization,
  isDefaultOrganization,
} from "@/repositories/tenant-context";
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryContext,
  type RepositoryResult,
} from "@/repositories/types";
import type {
  CreateServiceInput,
  ServiceListOptions,
  ServiceRepository,
  UpdateServiceInput,
} from "./service-repository";

type LegacyServiceItem = Omit<
  ServiceItem,
  "onlineBookingEnabled" | "bufferBeforeMinutes" | "bufferAfterMinutes"
> & {
  onlineBookingEnabled?: boolean;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
};

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `service-${Date.now()}`;
}

function isLegacyServiceItem(value: unknown): value is LegacyServiceItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.durationMinutes === "number" &&
    typeof item.isActive === "boolean" &&
    (item.onlineBookingEnabled === undefined ||
      typeof item.onlineBookingEnabled === "boolean") &&
    (item.bufferBeforeMinutes === undefined ||
      typeof item.bufferBeforeMinutes === "number") &&
    (item.bufferAfterMinutes === undefined ||
      typeof item.bufferAfterMinutes === "number") &&
    typeof item.description === "string"
  );
}

function normalizeService(item: LegacyServiceItem): ServiceItem {
  return {
    ...item,
    onlineBookingEnabled: item.onlineBookingEnabled ?? true,
    bufferBeforeMinutes: item.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: item.bufferAfterMinutes ?? 0,
  };
}

function isValidService(item: ServiceItem): boolean {
  return (
    item.id.trim().length > 0 &&
    item.name.trim().length >= 2 &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isFinite(item.durationMinutes) &&
    item.durationMinutes >= 5 &&
    Number.isInteger(item.bufferBeforeMinutes) &&
    item.bufferBeforeMinutes >= 0 &&
    Number.isInteger(item.bufferAfterMinutes) &&
    item.bufferAfterMinutes >= 0
  );
}

function matchesOptions(
  item: ServiceItem,
  options?: ServiceListOptions,
): boolean {
  if (options?.activeOnly && !item.isActive) return false;
  if (options?.onlineBookingOnly && !item.onlineBookingEnabled) return false;
  return true;
}

export class LocalStorageServiceRepository implements ServiceRepository {
  constructor(private readonly storage: StorageAdapter) {}

  subscribe(subscriber: () => void): () => void {
    return this.storage.subscribe(
      LOCAL_STORAGE_KEYS.services,
      () => subscriber(),
    );
  }

  async list(
    context: RepositoryContext,
    options?: ServiceListOptions,
  ): Promise<RepositoryResult<ServiceItem[]>> {
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const tenantServices = filterByOrganization(context, stored.data);
    if (context.accessMode === "public_booking") {
      return repositorySuccess(
        tenantServices.filter(
          (item) => item.isActive && item.onlineBookingEnabled,
        ),
      );
    }
    return repositorySuccess(
      tenantServices.filter((item) => matchesOptions(item, options)),
    );
  }

  async getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ServiceItem>> {
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const item = filterByOrganization(context, stored.data).find(
      (service) => service.id === id,
    );
    if (!item) return repositoryFailure("not_found");
    if (
      context.accessMode === "public_booking" &&
      (!item.isActive || !item.onlineBookingEnabled)
    ) {
      return repositoryFailure("not_found");
    }
    return repositorySuccess(item);
  }

  async create(
    context: RepositoryContext,
    input: CreateServiceInput,
  ): Promise<RepositoryResult<ServiceItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const item: ServiceItem = { ...input, id: input.id ?? createId() };
    if (!isValidService(item)) return repositoryFailure("validation_error");

    const stored = this.readAll();
    if (!stored.ok) return stored;
    if (stored.data.some((service) => service.id === item.id)) {
      return repositoryFailure(
        "conflict",
        "Услуга с таким идентификатором уже существует.",
      );
    }
    const write = this.storage.set(LOCAL_STORAGE_KEYS.services, [
      ...stored.data,
      item,
    ]);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async update(
    context: RepositoryContext,
    id: string,
    input: UpdateServiceInput,
  ): Promise<RepositoryResult<ServiceItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((service) => service.id === id);
    if (index < 0) return repositoryFailure("not_found");
    const item = { ...stored.data[index], ...input, id };
    if (!isValidService(item)) return repositoryFailure("validation_error");

    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.services, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ServiceItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((service) => service.id === id);
    if (index < 0) return repositoryFailure("not_found");

    const item = { ...stored.data[index], isActive: false };
    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.services, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  private canMutate(context: RepositoryContext): boolean {
    return (
      isDefaultOrganization(context) &&
      context.accessMode === "authenticated" &&
      canManageServices(repositoryContextToCurrentUser(context))
    );
  }

  private readAll(): RepositoryResult<ServiceItem[]> {
    const read = this.storage.get<unknown>(LOCAL_STORAGE_KEYS.services);
    if (!read.ok) return repositoryFailureFromStorage(read);
    if (read.data === null) return repositorySuccess(defaultServices);
    if (!Array.isArray(read.data) || !read.data.every(isLegacyServiceItem)) {
      return repositoryFailure("validation_error");
    }
    return repositorySuccess(read.data.map(normalizeService));
  }
}
