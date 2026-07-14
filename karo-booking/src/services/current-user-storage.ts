import {
  CURRENT_USER_STORAGE_KEY,
  defaultCurrentUser,
  findCurrentUser,
} from "@/config/currentUser";
import type { CurrentUser } from "@/types/roles";

function readStoredUserId(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && "id" in value) {
    const { id } = value;
    return typeof id === "string" ? id : undefined;
  }

  return undefined;
}

export function loadCurrentUser(): CurrentUser {
  if (typeof window === "undefined") {
    return defaultCurrentUser;
  }

  try {
    const storedValue: unknown = JSON.parse(
      window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) ?? "null",
    );
    const userId = readStoredUserId(storedValue);
    return (userId && findCurrentUser(userId)) || defaultCurrentUser;
  } catch {
    return defaultCurrentUser;
  }
}

export function saveCurrentUser(user: CurrentUser): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const canonicalUser = findCurrentUser(user.id);
  if (!canonicalUser) {
    return false;
  }

  try {
    window.localStorage.setItem(
      CURRENT_USER_STORAGE_KEY,
      JSON.stringify(canonicalUser),
    );
    return true;
  } catch {
    return false;
  }
}
