import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";

const STORAGE_KEY = "karo-booking:services";
export const SERVICES_CHANGED_EVENT = "karo-booking:services-changed";

function isServiceItem(value: unknown): value is ServiceItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.price === "number" && typeof item.durationMinutes === "number" && typeof item.isActive === "boolean" && typeof item.description === "string";
}

export function loadServices(): ServiceItem[] {
  if (typeof window === "undefined") return defaultServices;
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return defaultServices;
    const parsedValue: unknown = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isServiceItem) : defaultServices;
  } catch {
    return defaultServices;
  }
}

export function saveServices(services: ServiceItem[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    window.dispatchEvent(new Event(SERVICES_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}
