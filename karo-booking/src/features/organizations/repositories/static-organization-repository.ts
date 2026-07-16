import type { Organization } from "@/features/organizations/types";
import { isDefaultOrganization } from "@/repositories/tenant-context";
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryContext,
  type RepositoryResult,
} from "@/repositories/types";
import type { OrganizationRepository } from "./organization-repository";

export class StaticOrganizationRepository implements OrganizationRepository {
  constructor(private readonly organizations: readonly Organization[]) {}

  async getBySlug(
    context: RepositoryContext,
    slug: string,
  ): Promise<RepositoryResult<Organization>> {
    const organization = this.visibleOrganizations(context).find(
      (item) => item.slug === slug,
    );

    return organization
      ? repositorySuccess({ ...organization })
      : repositoryFailure("not_found", "Салон не найден.");
  }

  async list(
    context: RepositoryContext,
  ): Promise<RepositoryResult<Organization[]>> {
    return repositorySuccess(
      this.visibleOrganizations(context).map((organization) => ({
        ...organization,
      })),
    );
  }

  private visibleOrganizations(context: RepositoryContext): Organization[] {
    if (!isDefaultOrganization(context)) return [];

    return this.organizations.filter(
      (organization) =>
        organization.id === context.organizationId &&
        (context.accessMode !== "public_booking" || organization.active),
    );
  }
}
