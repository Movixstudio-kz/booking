import type { ServiceItem } from "@/features/services/types";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

export type ServiceListOptions = {
  activeOnly?: boolean;
  onlineBookingOnly?: boolean;
};

export type CreateServiceInput = Omit<ServiceItem, "id"> & { id?: string };
export type UpdateServiceInput = Partial<Omit<ServiceItem, "id">>;

export interface ServiceRepository {
  subscribe(subscriber: () => void): () => void;
  list(
    context: RepositoryContext,
    options?: ServiceListOptions,
  ): Promise<RepositoryResult<ServiceItem[]>>;
  getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ServiceItem>>;
  create(
    context: RepositoryContext,
    input: CreateServiceInput,
  ): Promise<RepositoryResult<ServiceItem>>;
  update(
    context: RepositoryContext,
    id: string,
    input: UpdateServiceInput,
  ): Promise<RepositoryResult<ServiceItem>>;
  archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<ServiceItem>>;
}
