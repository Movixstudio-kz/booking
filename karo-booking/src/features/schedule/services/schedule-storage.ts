import { createDefaultStaffSchedule, defaultStaffSchedules } from "@/features/schedule/data";
import type {
  ExtraWorkingInterval,
  ScheduleBreak,
  ScheduleVacation,
  StaffSchedule,
  TimeInterval,
  Weekday,
} from "@/features/schedule/types";
import { WEEKDAYS } from "@/features/schedule/types";
import { isValidDateKey, isValidInterval } from "@/features/schedule/utils";

const STORAGE_KEY = "karo-booking:staff-schedules";
export const STAFF_SCHEDULES_CHANGED_EVENT = "karo-booking:staff-schedules-changed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function isTimeInterval(value: unknown): value is TimeInterval {
  if (!isRecord(value) || typeof value.start !== "string" || typeof value.end !== "string") return false;
  return isValidInterval({ start: value.start, end: value.end });
}

function isBreak(value: unknown): value is ScheduleBreak {
  return isRecord(value) && typeof value.id === "string" && typeof value.date === "string" && isValidDateKey(value.date) && typeof value.title === "string" && isTimeInterval(value);
}

function isVacation(value: unknown): value is ScheduleVacation {
  return isRecord(value) && typeof value.id === "string" && typeof value.startDate === "string" && typeof value.endDate === "string" && isValidDateKey(value.startDate) && isValidDateKey(value.endDate) && value.startDate <= value.endDate && (value.title === undefined || typeof value.title === "string");
}

function isExtraWorkingInterval(value: unknown): value is ExtraWorkingInterval {
  return isRecord(value) && typeof value.id === "string" && typeof value.date === "string" && isValidDateKey(value.date) && (value.title === undefined || typeof value.title === "string") && isTimeInterval(value);
}

function readWeeklySchedule(value: unknown): StaffSchedule["weeklySchedule"] | null {
  if (!isRecord(value)) return null;
  const entries = WEEKDAYS.map((weekday) => {
    const intervals = value[weekday];
    return Array.isArray(intervals) && intervals.every(isTimeInterval) ? [weekday, intervals] as const : null;
  });
  if (entries.some((entry) => entry === null)) return null;
  return Object.fromEntries(entries as [Weekday, TimeInterval[]][]) as StaffSchedule["weeklySchedule"];
}

function parseStaffSchedule(value: unknown): StaffSchedule | null {
  if (!isRecord(value) || typeof value.staffId !== "string" || !value.staffId) return null;
  const weeklySchedule = readWeeklySchedule(value.weeklySchedule);
  if (!weeklySchedule) return null;
  if (!Array.isArray(value.breaks) || !value.breaks.every(isBreak)) return null;
  if (!Array.isArray(value.daysOff) || !value.daysOff.every((date) => typeof date === "string" && isValidDateKey(date))) return null;
  if (!Array.isArray(value.vacations) || !value.vacations.every(isVacation)) return null;
  if (!Array.isArray(value.extraWorkingIntervals) || !value.extraWorkingIntervals.every(isExtraWorkingInterval)) return null;

  return {
    staffId: value.staffId,
    weeklySchedule,
    breaks: value.breaks,
    daysOff: [...new Set(value.daysOff)].sort(),
    vacations: value.vacations,
    extraWorkingIntervals: value.extraWorkingIntervals,
  };
}

export function loadStaffSchedules(): StaffSchedule[] {
  if (typeof window === "undefined") return defaultStaffSchedules;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return defaultStaffSchedules;
    const parsedValue: unknown = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) return defaultStaffSchedules;

    const storedSchedules = parsedValue
      .map(parseStaffSchedule)
      .filter((schedule): schedule is StaffSchedule => schedule !== null);
    const storedStaffIds = new Set(storedSchedules.map((schedule) => schedule.staffId));
    return [
      ...storedSchedules,
      ...defaultStaffSchedules.filter((schedule) => !storedStaffIds.has(schedule.staffId)),
    ];
  } catch {
    return defaultStaffSchedules;
  }
}

export function loadStaffSchedule(staffId: string): StaffSchedule {
  return loadStaffSchedules().find((schedule) => schedule.staffId === staffId) ?? createDefaultStaffSchedule(staffId);
}

export function saveStaffSchedules(schedules: StaffSchedule[]): boolean {
  if (typeof window === "undefined") return false;
  const normalizedSchedules = schedules.map(parseStaffSchedule);
  if (normalizedSchedules.some((schedule) => schedule === null)) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSchedules));
    window.dispatchEvent(new Event(STAFF_SCHEDULES_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function saveStaffSchedule(schedule: StaffSchedule): boolean {
  const normalizedSchedule = parseStaffSchedule(schedule);
  if (!normalizedSchedule) return false;
  const schedules = loadStaffSchedules();
  const exists = schedules.some((item) => item.staffId === normalizedSchedule.staffId);
  const nextSchedules = exists
    ? schedules.map((item) => item.staffId === normalizedSchedule.staffId ? normalizedSchedule : item)
    : [...schedules, normalizedSchedule];
  return saveStaffSchedules(nextSchedules);
}
