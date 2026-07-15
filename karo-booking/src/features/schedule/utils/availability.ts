import type {
  ScheduleAvailability,
  ScheduledAppointment,
  StaffSchedule,
  TimeInterval,
} from "@/features/schedule/types";
import {
  getWeekday,
  isValidDateKey,
  isValidTime,
  timeToMinutes,
} from "./time";

export type ScheduleAvailabilityInput = {
  schedule: StaffSchedule;
  date: string;
  time: string;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  appointments?: ScheduledAppointment[];
  excludeAppointmentId?: string;
  now?: Date;
};

export function isDateInVacation(schedule: StaffSchedule, date: string): boolean {
  return schedule.vacations.some((vacation) => date >= vacation.startDate && date <= vacation.endDate);
}

export function getWorkingIntervalsForDate(schedule: StaffSchedule, date: string): TimeInterval[] {
  if (!isValidDateKey(date) || isDateInVacation(schedule, date)) return [];

  const extraIntervals = schedule.extraWorkingIntervals
    .filter((interval) => interval.date === date)
    .map(({ start, end }) => ({ start, end }));

  if (schedule.daysOff.includes(date)) return extraIntervals;

  return [
    ...schedule.weeklySchedule[getWeekday(date)],
    ...extraIntervals,
  ];
}

export function getScheduleAvailability({
  schedule,
  date,
  time,
  durationMinutes,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
  appointments = [],
  excludeAppointmentId,
  now = new Date(),
}: ScheduleAvailabilityInput): ScheduleAvailability {
  if (
    !isValidDateKey(date) ||
    !isValidTime(time) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    !Number.isFinite(bufferBeforeMinutes) ||
    bufferBeforeMinutes < 0 ||
    !Number.isFinite(bufferAfterMinutes) ||
    bufferAfterMinutes < 0
  ) {
    return { available: false, reason: "outside_working_hours" };
  }

  const requestedStartMinutes = timeToMinutes(time) - bufferBeforeMinutes;
  const requestedEndMinutes = timeToMinutes(time) + durationMinutes + bufferAfterMinutes;
  const requestedDateTime = new Date(`${date}T${time}:00`);

  const availabilityStart = requestedDateTime.getTime() - bufferBeforeMinutes * 60_000;
  if (availabilityStart < now.getTime()) return { available: false, reason: "past" };
  if (isDateInVacation(schedule, date)) return { available: false, reason: "vacation" };

  const extraIntervals = schedule.extraWorkingIntervals.filter((interval) => interval.date === date);
  const isInsideExtraInterval = extraIntervals.some((interval) => intervalContainsMinutes(interval, requestedStartMinutes, requestedEndMinutes));
  if (schedule.daysOff.includes(date) && !isInsideExtraInterval) return { available: false, reason: "day_off" };

  const workingIntervals = getWorkingIntervalsForDate(schedule, date);
  if (!workingIntervals.some((interval) => intervalContainsMinutes(interval, requestedStartMinutes, requestedEndMinutes))) {
    return { available: false, reason: "outside_working_hours" };
  }

  const intersectsBreak = schedule.breaks
    .filter((item) => item.date === date)
    .some((item) => intervalOverlapsMinutes(item, requestedStartMinutes, requestedEndMinutes));
  if (intersectsBreak) return { available: false, reason: "break" };

  const intersectsAppointment = appointments.some((appointment) => {
    if (
      appointment.id === excludeAppointmentId ||
      appointment.staffId !== schedule.staffId ||
      appointment.date !== date ||
      appointment.status === "cancelled"
    ) return false;

    const appointmentStartMinutes =
      timeToMinutes(appointment.time) - (appointment.bufferBeforeMinutes ?? 0);
    const appointmentEndMinutes =
      timeToMinutes(appointment.time) +
      appointment.durationMinutes +
      (appointment.bufferAfterMinutes ?? 0);
    return requestedStartMinutes < appointmentEndMinutes && requestedEndMinutes > appointmentStartMinutes;
  });

  return intersectsAppointment
    ? { available: false, reason: "appointment_overlap" }
    : { available: true, reason: "available" };
}

export function isScheduleSlotAvailable(input: ScheduleAvailabilityInput): boolean {
  return getScheduleAvailability(input).available;
}

export function getAvailableScheduleSlots(
  schedule: StaffSchedule,
  date: string,
  slots: string[],
  durationMinutes: number,
  appointments: ScheduledAppointment[] = [],
  now: Date = new Date(),
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
): string[] {
  return slots.filter((time) => isScheduleSlotAvailable({
    schedule,
    date,
    time,
    durationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    appointments,
    now,
  }));
}

function intervalContainsMinutes(interval: TimeInterval, startMinutes: number, endMinutes: number): boolean {
  return timeToMinutes(interval.start) <= startMinutes && timeToMinutes(interval.end) >= endMinutes;
}

function intervalOverlapsMinutes(interval: TimeInterval, startMinutes: number, endMinutes: number): boolean {
  return timeToMinutes(interval.start) < endMinutes && timeToMinutes(interval.end) > startMinutes;
}
