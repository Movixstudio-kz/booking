import type { RepositoryContext } from "@/repositories/types";
import type { CurrentUser } from "@/types/roles";

export function repositoryContextToCurrentUser(
  context: RepositoryContext,
): CurrentUser {
  return {
    id: context.currentUserId,
    name: context.currentUserId,
    role: context.currentRole,
    ...(context.staffId ? { staffId: context.staffId } : {}),
  };
}
