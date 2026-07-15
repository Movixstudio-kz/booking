import type { ClientItem } from "@/features/clients/types";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

type MutableClientFields = Omit<
  ClientItem,
  "id" | "normalizedPhone" | "archivedAt" | "createdAt" | "updatedAt"
>;

export type CreateClientInput = Pick<
  MutableClientFields,
  "fullName" | "phone"
> &
  Partial<Omit<MutableClientFields, "fullName" | "phone">> & {
  id?: string;
};

export type UpdateClientInput = Partial<
  MutableClientFields
>;

export interface ClientRepository {
  subscribe(subscriber: () => void): () => void;
  list(
    context: RepositoryContext,
    search?: string,
  ): Promise<RepositoryResult<ClientItem[]>>;
  getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ClientItem>>;
  findByPhone(
    context: RepositoryContext,
    phone: string,
  ): Promise<RepositoryResult<ClientItem | null>>;
  create(
    context: RepositoryContext,
    input: CreateClientInput,
  ): Promise<RepositoryResult<ClientItem>>;
  update(
    context: RepositoryContext,
    id: string,
    input: UpdateClientInput,
  ): Promise<RepositoryResult<ClientItem>>;
  archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ClientItem>>;
}
