import type {
  ScheduleAvailability,
  ScheduledAppointment,
  StaffSchedule,
  TimeInterval,
} from "@/features/schedule/types";
import {
  getWeekday,
  intervalContains,
  intervalsOverlap,
  isValidDateKey,
  isValidTime,
  timeToMinutes,
} from "./time";

export type ScheduleAvailabilityInput = {
  schedule: StaffSchedule;
  date: string;
  time: string;
  durationMinutes: number;
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
  appointments = [],
  excludeAppointmentId,
  now = new Date(),
}: ScheduleAvailabilityInput): ScheduleAvailability {
  if (!isValidDateKey(date) || !isValidTime(time) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { available: false, reason: "outside_working_hours" };
  }

  const requestedInterval = {
    start: time,
    end: minutesToUnboundedTime(timeToMinutes(time) + durationMinutes),
  };
  const requestedDateTime = new Date(`${date}T${time}:00`);

  if (requestedDateTime.getTime() < now.getTime()) return { available: false, reason: "past" };
  if (isDateInVacation(schedule, date)) return { available: false, reason: "vacation" };

  const extraIntervals = schedule.extraWorkingIntervals.filter((interval) => interval.date === date);
  const isInsideExtraInterval = extraIntervals.some((interval) => intervalContains(interval, requestedInterval));
  if (schedule.daysOff.includes(date) && !isInsideExtraInterval) return { available: false, reason: "day_off" };

  const workingIntervals = getWorkingIntervalsForDate(schedule, date);
  if (!workingIntervals.some((interval) => intervalContains(interval, requestedInterval))) {
    return { available: false, reason: "outside_working_hours" };
  }

  const intersectsBreak = schedule.breaks
    .filter((item) => item.date === date)
    .some((item) => intervalsOverlap(item, requestedInterval));
  if (intersectsBreak) return { available: false, reason: "break" };

  const intersectsAppointment = appointments.some((appointment) => {
    if (
      appointment.id === excludeAppointmentId ||
      appointment.staffId !== schedule.staffId ||
      appointment.date !== date ||
      appointment.status === "cancelled"
    ) return false;

    const appointmentInterval = {
      start: appointment.time,
      end: minutesToUnboundedTime(timeToMinutes(appointment.time) + appointment.durationMinutes),
    };
    return intervalsOverlap(appointmentInterval, requestedInterval);
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
): string[] {
  return slots.filter((time) => isScheduleSlotAvailable({ schedule, date, time, durationMinutes, appointments, now }));
}

function minutesToUnboundedTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
