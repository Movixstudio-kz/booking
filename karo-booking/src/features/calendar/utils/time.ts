import { calculateAppointmentRange } from "@/features/appointments/utils";
import { createTimeSlots } from "@/features/booking/utils";

export const CALENDAR_START_MINUTES = 9 * 60;
export const CALENDAR_END_MINUTES = 20 * 60;
export const HALF_HOUR_HEIGHT = 44;

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getHalfHourSlots(): string[] {
  return createTimeSlots();
}

export function getEndTime(startTime: string, durationMinutes: number): string {
  const range = calculateAppointmentRange({
    startAt: `2000-01-01T${startTime}:00.000Z`,
    durationMinutes,
  });
  return range.visibleEndAt.slice(11, 16);
}

export function getEventPosition(time: string, durationMinutes: number): { top: number; height: number } {
  const top = ((timeToMinutes(time) - CALENDAR_START_MINUTES) / 30) * HALF_HOUR_HEIGHT;
  const height = Math.max(38, (durationMinutes / 30) * HALF_HOUR_HEIGHT - 4);
  return { top, height };
}
