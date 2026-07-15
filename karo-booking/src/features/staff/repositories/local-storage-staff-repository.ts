import { defaultStaff } from "@/features/staff/data";
import type { PublicStaffItem, StaffItem } from "@/features/staff/types";
import type { StorageAdapter } from "@/lib/storage";
import { canManageStaff, canViewStaffProfile } from "@/lib/permissions";
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
  CreateStaffInput,
  StaffRepository,
  UpdateStaffInput,
} from "./staff-repository";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `staff-${Date.now()}`;
}

function isStaffItem(value: unknown): value is StaffItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.position === "string" &&
    typeof item.phone === "string" &&
    typeof item.calendarColor === "string" &&
    typeof item.isActive === "boolean" &&
    Array.isArray(item.serviceIds) &&
    item.serviceIds.every((id) => typeof id === "string")
  );
}

function isValidStaff(item: StaffItem): boolean {
  return (
    item.id.trim().length > 0 &&
    item.name.trim().length >= 2 &&
    item.position.trim().length > 0 &&
    item.phone.replace(/\D/g, "").length >= 7 &&
    /^#[0-9a-f]{6}$/i.test(item.calendarColor) &&
    item.serviceIds.every((id) => id.trim().length > 0)
  );
}

export class LocalStorageStaffRepository implements StaffRepository {
  constructor(private readonly storage: StorageAdapter) {}

  subscribe(subscriber: () => void): () => void {
    return this.storage.subscribe(LOCAL_STORAGE_KEYS.staff, () => subscriber());
  }

  async list(
    context: RepositoryContext,
  ): Promise<RepositoryResult<StaffItem[]>> {
    if (context.accessMode === "public_booking") {
      return repositoryFailure("forbidden");
    }
    const stored = this.readAll();
    if (!stored.ok) return stored;

    const user = repositoryContextToCurrentUser(context);
    const tenantStaff = filterByOrganization(context, stored.data);
    return repositorySuccess(
      tenantStaff
        .filter((item) => canViewStaffProfile(user, item.id, item.isActive))
        .map((item) => user.role === "staff" && user.staffId !== item.id
          ? { ...item, phone: "" }
          : item),
    );
  }

  async listPublic(
    context: RepositoryContext,
  ): Promise<RepositoryResult<PublicStaffItem[]>> {
    if (context.accessMode !== "public_booking") {
      return repositoryFailure("forbidden");
    }
    const stored = this.readAll();
    if (!stored.ok) return stored;
    return repositorySuccess(
      filterByOrganization(context, stored.data)
        .filter((item) => item.isActive)
        .map(toPublicStaffItem),
    );
  }

  async getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<StaffItem>> {
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const item = filterByOrganization(context, stored.data).find(
      (member) => member.id === id,
    );
    if (!item) return repositoryFailure("not_found");
    if (context.accessMode === "public_booking") {
      return repositoryFailure("forbidden");
    }
    if (
      !canViewStaffProfile(
        repositoryContextToCurrentUser(context),
        item.id,
        item.isActive,
      )
    ) {
      return repositoryFailure("forbidden");
    }
    return repositorySuccess(item);
  }

  async create(
    context: RepositoryContext,
    input: CreateStaffInput,
  ): Promise<RepositoryResult<StaffItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const item: StaffItem = { ...input, id: input.id ?? createId() };
    if (!isValidStaff(item)) return repositoryFailure("validation_error");

    const stored = this.readAll();
    if (!stored.ok) return stored;
    if (stored.data.some((member) => member.id === item.id)) {
      return repositoryFailure(
        "conflict",
        "Сотрудник с таким идентификатором уже существует.",
      );
    }
    const write = this.storage.set(LOCAL_STORAGE_KEYS.staff, [
      ...stored.data,
      item,
    ]);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async update(
    context: RepositoryContext,
    id: string,
    input: UpdateStaffInput,
  ): Promise<RepositoryResult<StaffItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((member) => member.id === id);
    if (index < 0) return repositoryFailure("not_found");
    const item = { ...stored.data[index], ...input, id };
    if (!isValidStaff(item)) return repositoryFailure("validation_error");

    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.staff, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<StaffItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((member) => member.id === id);
    if (index < 0) return repositoryFailure("not_found");

    const item = { ...stored.data[index], isActive: false };
    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.staff, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  private canMutate(context: RepositoryContext): boolean {
    return (
      isDefaultOrganization(context) &&
      context.accessMode === "authenticated" &&
      canManageStaff(repositoryContextToCurrentUser(context))
    );
  }

  private readAll(): RepositoryResult<StaffItem[]> {
    const read = this.storage.get<unknown>(LOCAL_STORAGE_KEYS.staff);
    if (!read.ok) return repositoryFailureFromStorage(read);
    if (read.data === null) return repositorySuccess(defaultStaff);
    if (!Array.isArray(read.data) || !read.data.every(isStaffItem)) {
      return repositoryFailure("validation_error");
    }
    return repositorySuccess(read.data);
  }
}

function toPublicStaffItem(item: StaffItem): PublicStaffItem {
  return {
    id: item.id,
    name: item.name,
    position: item.position,
    calendarColor: item.calendarColor,
    isActive: item.isActive,
    serviceIds: [...item.serviceIds],
  };
}
