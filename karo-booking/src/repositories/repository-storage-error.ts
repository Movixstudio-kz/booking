import type { StorageResult } from "@/lib/storage";
import {
  repositoryFailure,
  type RepositoryResult,
} from "@/repositories/types";

type StorageFailure = Extract<StorageResult<unknown>, { ok: false }>;

export function repositoryFailureFromStorage<T>(
  failure: StorageFailure,
): RepositoryResult<T> {
  if (failure.error === "storage_unavailable") {
    return repositoryFailure("storage_unavailable", undefined, failure.cause);
  }

  if (failure.error === "invalid_json") {
    return repositoryFailure("validation_error", undefined, failure.cause);
  }

  return repositoryFailure("unknown", undefined, failure.cause);
}
