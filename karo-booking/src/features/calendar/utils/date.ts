import type { CalendarView } from "@/features/calendar/types";

export function toDateKey(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay() || 7;
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), 1 - day);
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getMonthDays(date: Date): Date[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function moveCursor(date: Date, view: CalendarView, direction: -1 | 1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, direction * 7);
  return addMonths(date, direction);
}

export function formatCalendarTitle(date: Date, view: CalendarView): string {
  if (view === "day") return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  if (view === "week") {
    const days = getWeekDays(date);
    return `${days[0].toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} — ${days[6].toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date);
}
