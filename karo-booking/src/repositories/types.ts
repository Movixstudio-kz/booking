import type { UserRole } from "@/types/roles";

export type RepositoryErrorCode =
  | "not_found"
  | "forbidden"
  | "validation_error"
  | "conflict"
  | "storage_unavailable"
  | "unknown";

export type RepositoryError = {
  code: RepositoryErrorCode;
  message: string;
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
};

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError };

export type RepositoryAccessMode = "authenticated" | "public_booking";

export type TenantContext = {
  organizationId: string;
};

export type RepositoryContext = TenantContext & {
  currentUserId: string;
  currentRole: UserRole;
  staffId: string | null;
  accessMode: RepositoryAccessMode;
};

export const REPOSITORY_ERROR_MESSAGES: Readonly<
  Record<RepositoryErrorCode, string>
> = {
  not_found: "Запрашиваемые данные не найдены.",
  forbidden: "Недостаточно прав для выполнения этого действия.",
  validation_error: "Проверьте введённые данные.",
  conflict: "У сотрудника уже есть запись на это время.",
  storage_unavailable: "Не удалось получить доступ к хранилищу данных.",
  unknown: "Произошла непредвиденная ошибка.",
};

export function repositorySuccess<T>(data: T): RepositoryResult<T> {
  return { ok: true, data };
}

export function repositoryFailure<T = never>(
  code: RepositoryErrorCode,
  message: string = REPOSITORY_ERROR_MESSAGES[code],
  cause?: unknown,
  details?: Readonly<Record<string, unknown>>,
): RepositoryResult<T> {
  return {
    ok: false,
    error: { code, message, cause, details },
  };
}
