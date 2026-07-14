import { defaultStaff } from "@/features/staff/data";
import type { StaffSchedule, WeeklySchedule } from "@/features/schedule/types";

export function createDefaultWeeklySchedule(): WeeklySchedule {
  return {
    monday: [{ start: "09:00", end: "20:00" }],
    tuesday: [{ start: "09:00", end: "20:00" }],
    wednesday: [{ start: "09:00", end: "20:00" }],
    thursday: [{ start: "09:00", end: "20:00" }],
    friday: [{ start: "09:00", end: "20:00" }],
    saturday: [{ start: "09:00", end: "20:00" }],
    sunday: [],
  };
}

export function createDefaultStaffSchedule(staffId: string): StaffSchedule {
  return {
    staffId,
    weeklySchedule: createDefaultWeeklySchedule(),
    breaks: [],
    daysOff: [],
    vacations: [],
    extraWorkingIntervals: [],
  };
}

export const defaultStaffSchedules: StaffSchedule[] = defaultStaff.map((member) =>
  createDefaultStaffSchedule(member.id),
);
