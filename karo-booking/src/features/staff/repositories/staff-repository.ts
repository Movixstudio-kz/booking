import type { PublicStaffItem, StaffItem } from "@/features/staff/types";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

export type CreateStaffInput = Omit<StaffItem, "id"> & { id?: string };
export type UpdateStaffInput = Partial<Omit<StaffItem, "id">>;

export interface StaffRepository {
  subscribe(subscriber: () => void): () => void;
  list(context: RepositoryContext): Promise<RepositoryResult<StaffItem[]>>;
  listPublic(
    context: RepositoryContext,
  ): Promise<RepositoryResult<PublicStaffItem[]>>;
  getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<StaffItem>>;
  create(
    context: RepositoryContext,
    input: CreateStaffInput,
  ): Promise<RepositoryResult<StaffItem>>;
  update(
    context: RepositoryContext,
    id: string,
    input: UpdateStaffInput,
  ): Promise<RepositoryResult<StaffItem>>;
  archive(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<StaffItem>>;
}
