import type { TimeInterval, Weekday } from "@/features/schedule/types";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const weekdayByDayIndex: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}
export function isValidDateKey(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekday(dateKey: string): Weekday {
  const date = new Date(`${dateKey}T12:00:00`);
  return weekdayByDayIndex[date.getDay()];
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const normalizedMinutes = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isValidInterval(interval: TimeInterval): boolean {
  return isValidTime(interval.start) && isValidTime(interval.end) && timeToMinutes(interval.start) < timeToMinutes(interval.end);
}

export function intervalsOverlap(first: TimeInterval, second: TimeInterval): boolean {
  return timeToMinutes(first.start) < timeToMinutes(second.end) && timeToMinutes(first.end) > timeToMinutes(second.start);
}

export function intervalContains(container: TimeInterval, interval: TimeInterval): boolean {
  return timeToMinutes(container.start) <= timeToMinutes(interval.start) && timeToMinutes(container.end) >= timeToMinutes(interval.end);
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = intervals
    .filter(isValidInterval)
    .map((interval) => ({ ...interval }))
    .sort((first, second) => timeToMinutes(first.start) - timeToMinutes(second.start));

  return sorted.reduce<TimeInterval[]>((merged, interval) => {
    const previous = merged.at(-1);
    if (!previous || timeToMinutes(previous.end) < timeToMinutes(interval.start)) {
      merged.push(interval);
      return merged;
    }

    if (timeToMinutes(interval.end) > timeToMinutes(previous.end)) previous.end = interval.end;
    return merged;
  }, []);
}

export function clampInterval(interval: TimeInterval, boundary: TimeInterval): TimeInterval | null {
  const start = Math.max(timeToMinutes(interval.start), timeToMinutes(boundary.start));
  const end = Math.min(timeToMinutes(interval.end), timeToMinutes(boundary.end));
  return start < end ? { start: minutesToTime(start), end: minutesToTime(end) } : null;
}
