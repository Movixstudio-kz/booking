import { defaultStaff } from "@/features/staff/data";
import type { StaffItem } from "@/features/staff/types";

const STORAGE_KEY = "karo-booking:staff";
export const STAFF_CHANGED_EVENT = "karo-booking:staff-changed";

function isStaffItem(value: unknown): value is StaffItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.position === "string" && typeof item.phone === "string" && typeof item.calendarColor === "string" && typeof item.isActive === "boolean" && Array.isArray(item.serviceIds) && item.serviceIds.every((id) => typeof id === "string");
}

export function loadStaff(): StaffItem[] {
  if (typeof window === "undefined") return defaultStaff;
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return defaultStaff;
    const parsedValue: unknown = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isStaffItem) : defaultStaff;
  } catch {
    return defaultStaff;
  }
}

export function saveStaff(staff: StaffItem[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    window.dispatchEvent(new Event(STAFF_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function removeServiceFromStaff(serviceId: string): void {
  const nextStaff = loadStaff().map((member) => ({ ...member, serviceIds: member.serviceIds.filter((id) => id !== serviceId) }));
  saveStaff(nextStaff);
}
