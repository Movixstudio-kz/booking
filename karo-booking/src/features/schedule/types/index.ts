export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type TimeInterval = {
  start: string;
  end: string;
};
export type WeeklySchedule = Record<Weekday, TimeInterval[]>;

export type ScheduleBreak = TimeInterval & {
  id: string;
  date: string;
  title: string;
};

export type ScheduleVacation = {
  id: string;
  startDate: string;
  endDate: string;
  title?: string;
};

export type ExtraWorkingInterval = TimeInterval & {
  id: string;
  date: string;
  title?: string;
};

export type StaffSchedule = {
  staffId: string;
  weeklySchedule: WeeklySchedule;
  breaks: ScheduleBreak[];
  daysOff: string[];
  vacations: ScheduleVacation[];
  extraWorkingIntervals: ExtraWorkingInterval[];
};

export type ScheduleAvailabilityReason =
  | "available"
  | "past"
  | "outside_working_hours"
  | "break"
  | "day_off"
  | "vacation"
  | "appointment_overlap";

export type ScheduleAvailability = {
  available: boolean;
  reason: ScheduleAvailabilityReason;
};

export type ScheduledAppointment = {
  id?: string;
  staffId: string;
  date: string;
  time: string;
  durationMinutes: number;
  status?: string;
};

export type ScheduleVisualBlockKind = "non_working" | "break" | "day_off" | "vacation";

export type ScheduleVisualBlock = TimeInterval & {
  id: string;
  kind: ScheduleVisualBlockKind;
  title: string;
};
