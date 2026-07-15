import type { TenantContext } from "@/repositories/types";

export const DEFAULT_ORGANIZATION_ID = "default-organization";

export function isDefaultOrganization(context: TenantContext): boolean {
  return context.organizationId === DEFAULT_ORGANIZATION_ID;
}

export function filterByOrganization<T>(
  context: TenantContext,
  records: readonly T[],
): T[] {
  return isDefaultOrganization(context) ? [...records] : [];
}
