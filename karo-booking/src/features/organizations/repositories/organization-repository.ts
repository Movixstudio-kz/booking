import type { Organization } from "@/features/organizations/types";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

export interface OrganizationRepository {
  getBySlug(
    context: RepositoryContext,
    slug: string,
  ): Promise<RepositoryResult<Organization>>;
  list(context: RepositoryContext): Promise<RepositoryResult<Organization[]>>;
}
