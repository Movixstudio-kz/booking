import {
  calculateAppointmentRange,
  intervalsOverlap,
  parseDateTime,
  type AppointmentRange,
} from "@/features/appointments/utils";
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
    !Number.isInteger(bufferBeforeMinutes) ||
    bufferBeforeMinutes < 0 ||
    !Number.isInteger(bufferAfterMinutes) ||
    bufferAfterMinutes < 0
  ) {
    return { available: false, reason: "outside_working_hours" };
  }

  const requestedRange = calculateAppointmentRange({
    startAt: toLocalDateTime(date, time),
    durationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
  });
  const visibleStartTimestamp = parseDateTime(requestedRange.visibleStartAt);

  if (
    visibleStartTimestamp === null ||
    visibleStartTimestamp < now.getTime()
  ) {
    return { available: false, reason: "past" };
  }
  if (isDateInVacation(schedule, date)) return { available: false, reason: "vacation" };

  const extraIntervals = schedule.extraWorkingIntervals.filter((interval) => interval.date === date);
  const isInsideExtraInterval = extraIntervals.some((interval) =>
    intervalContainsRange(interval, date, requestedRange),
  );
  if (schedule.daysOff.includes(date) && !isInsideExtraInterval) return { available: false, reason: "day_off" };

  const workingIntervals = getWorkingIntervalsForDate(schedule, date);
  if (
    !workingIntervals.some((interval) =>
      intervalContainsRange(interval, date, requestedRange),
    )
  ) {
    return { available: false, reason: "outside_working_hours" };
  }

  const intersectsBreak = schedule.breaks
    .filter((item) => item.date === date)
    .some((item) =>
      intervalsOverlap(
        {
          startAt: requestedRange.blockedStartAt,
          endAt: requestedRange.blockedEndAt,
        },
        {
          startAt: toLocalDateTime(item.date, item.start),
          endAt: toLocalDateTime(item.date, item.end),
        },
      ),
    );
  if (intersectsBreak) return { available: false, reason: "break" };

  const intersectsAppointment = appointments.some((appointment) => {
    if (
      appointment.id === excludeAppointmentId ||
      appointment.staffId !== schedule.staffId ||
      appointment.status === "cancelled"
    ) return false;

    const appointmentRange = calculateAppointmentRange({
      startAt: toLocalDateTime(appointment.date, appointment.time),
      durationMinutes: appointment.durationMinutes,
      bufferBeforeMinutes: appointment.bufferBeforeMinutes,
      bufferAfterMinutes: appointment.bufferAfterMinutes,
    });

    return intervalsOverlap(
      {
        startAt: requestedRange.blockedStartAt,
        endAt: requestedRange.blockedEndAt,
      },
      {
        startAt: appointmentRange.blockedStartAt,
        endAt: appointmentRange.blockedEndAt,
      },
    );
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

function intervalContainsRange(
  interval: TimeInterval,
  date: string,
  range: AppointmentRange,
): boolean {
  const intervalStart = parseDateTime(toLocalDateTime(date, interval.start));
  const intervalEnd = parseDateTime(toLocalDateTime(date, interval.end));
  const visibleStart = parseDateTime(range.visibleStartAt);
  const visibleEnd = parseDateTime(range.visibleEndAt);

  return (
    intervalStart !== null &&
    intervalEnd !== null &&
    visibleStart !== null &&
    visibleEnd !== null &&
    intervalStart <= visibleStart &&
    intervalEnd >= visibleEnd
  );
}

function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}
