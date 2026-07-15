import type { ClientItem } from "@/features/clients/types";
import { normalizePhone } from "@/features/clients/utils";
import type { StorageAdapter } from "@/lib/storage";
import { canManageClients, canViewClients } from "@/lib/permissions";
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
  ClientRepository,
  CreateClientInput,
  UpdateClientInput,
} from "./client-repository";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isClientItem(value: unknown): value is ClientItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.fullName === "string" &&
    typeof item.phone === "string" &&
    typeof item.normalizedPhone === "string" &&
    isNullableString(item.whatsappPhone) &&
    isNullableString(item.email) &&
    isNullableString(item.birthDate) &&
    ["female", "male", "other", "unspecified"].includes(
      String(item.gender),
    ) &&
    typeof item.notes === "string" &&
    typeof item.allergies === "string" &&
    ["admin", "booking"].includes(String(item.source)) &&
    isNullableString(item.photoUrl) &&
    typeof item.marketingConsent === "boolean" &&
    isNullableString(item.archivedAt) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function isValidClient(item: ClientItem): boolean {
  return (
    item.id.trim().length > 0 &&
    item.fullName.trim().length >= 2 &&
    item.normalizedPhone.replace(/\D/g, "").length >= 7 &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    Number.isFinite(Date.parse(item.updatedAt))
  );
}

function createClientRecord(input: CreateClientInput): ClientItem {
  const now = new Date().toISOString();
  return {
    id: input.id ?? createId(),
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    normalizedPhone: normalizePhone(input.phone),
    whatsappPhone: input.whatsappPhone ?? null,
    email: input.email ?? null,
    birthDate: input.birthDate ?? null,
    gender: input.gender ?? "unspecified",
    notes: input.notes?.trim() ?? "",
    allergies: input.allergies?.trim() ?? "",
    source: input.source ?? "admin",
    photoUrl: input.photoUrl ?? null,
    marketingConsent: input.marketingConsent ?? false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export class LocalStorageClientRepository implements ClientRepository {
  constructor(private readonly storage: StorageAdapter) {}

  subscribe(subscriber: () => void): () => void {
    return this.storage.subscribe(
      LOCAL_STORAGE_KEYS.clients,
      () => subscriber(),
    );
  }

  async list(
    context: RepositoryContext,
    search?: string,
  ): Promise<RepositoryResult<ClientItem[]>> {
    if (
      context.accessMode === "public_booking" ||
      !canViewClients(repositoryContextToCurrentUser(context))
    ) {
      return repositoryFailure("forbidden");
    }
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const query = search?.trim().toLocaleLowerCase("ru") ?? "";
    const normalizedQuery = normalizePhone(query);
    return repositorySuccess(
      filterByOrganization(context, stored.data).filter(
        (item) =>
          item.archivedAt === null &&
          (!query ||
            item.fullName.toLocaleLowerCase("ru").includes(query) ||
            item.phone.includes(query) ||
            (normalizedQuery.length > 1 &&
              item.normalizedPhone.includes(normalizedQuery))),
      ),
    );
  }

  async getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ClientItem>> {
    if (
      context.accessMode === "public_booking" ||
      !canViewClients(repositoryContextToCurrentUser(context))
    ) {
      return repositoryFailure("forbidden");
    }
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const item = filterByOrganization(context, stored.data).find(
      (client) => client.id === id && client.archivedAt === null,
    );
    return item ? repositorySuccess(item) : repositoryFailure("not_found");
  }

  async findByPhone(
    context: RepositoryContext,
    phone: string,
  ): Promise<RepositoryResult<ClientItem | null>> {
    if (
      context.accessMode === "public_booking" ||
      !canViewClients(repositoryContextToCurrentUser(context))
    ) {
      return repositoryFailure("forbidden");
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return repositoryFailure("validation_error");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    return repositorySuccess(
      filterByOrganization(context, stored.data).find(
        (item) =>
          item.archivedAt === null &&
          item.normalizedPhone === normalizedPhone,
      ) ?? null,
    );
  }

  async create(
    context: RepositoryContext,
    input: CreateClientInput,
  ): Promise<RepositoryResult<ClientItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const item = createClientRecord(input);
    if (!isValidClient(item)) return repositoryFailure("validation_error");

    const stored = this.readAll();
    if (!stored.ok) return stored;
    if (
      stored.data.some(
        (client) =>
          client.id === item.id ||
          client.normalizedPhone === item.normalizedPhone,
      )
    ) {
      return repositoryFailure(
        "conflict",
        "Клиент с таким номером телефона уже существует.",
      );
    }
    const write = this.storage.set(LOCAL_STORAGE_KEYS.clients, [
      ...stored.data,
      item,
    ]);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async update(
    context: RepositoryContext,
    id: string,
    input: UpdateClientInput,
  ): Promise<RepositoryResult<ClientItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((client) => client.id === id);
    if (index < 0) return repositoryFailure("not_found");
    const previous = stored.data[index];
    const phone = input.phone?.trim() ?? previous.phone;
    const item: ClientItem = {
      ...previous,
      ...input,
      id,
      fullName: input.fullName?.trim() ?? previous.fullName,
      phone,
      normalizedPhone: normalizePhone(phone),
      createdAt: previous.createdAt,
      archivedAt: previous.archivedAt,
      updatedAt: new Date().toISOString(),
    };
    if (!isValidClient(item)) return repositoryFailure("validation_error");
    if (
      stored.data.some(
        (client) =>
          client.id !== id &&
          client.normalizedPhone === item.normalizedPhone,
      )
    ) {
      return repositoryFailure(
        "conflict",
        "Клиент с таким номером телефона уже существует.",
      );
    }

    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.clients, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  async archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ClientItem>> {
    if (!this.canMutate(context)) return repositoryFailure("forbidden");
    const stored = this.readAll();
    if (!stored.ok) return stored;
    const index = stored.data.findIndex((client) => client.id === id);
    if (index < 0) return repositoryFailure("not_found");
    const now = new Date().toISOString();
    const item = { ...stored.data[index], archivedAt: now, updatedAt: now };
    const next = [...stored.data];
    next[index] = item;
    const write = this.storage.set(LOCAL_STORAGE_KEYS.clients, next);
    if (!write.ok) return repositoryFailureFromStorage(write);
    return repositorySuccess(item);
  }

  private canMutate(context: RepositoryContext): boolean {
    return (
      isDefaultOrganization(context) &&
      context.accessMode === "authenticated" &&
      canManageClients(repositoryContextToCurrentUser(context))
    );
  }

  private readAll(): RepositoryResult<ClientItem[]> {
    const read = this.storage.get<unknown>(LOCAL_STORAGE_KEYS.clients);
    if (!read.ok) return repositoryFailureFromStorage(read);
    if (read.data === null) return repositorySuccess([]);
    if (!Array.isArray(read.data) || !read.data.every(isClientItem)) {
      return repositoryFailure("validation_error");
    }
    return repositorySuccess(read.data);
  }
}
