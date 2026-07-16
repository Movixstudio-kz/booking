import { describe, expect, it } from "vitest";
import type {
  ScheduledAppointment,
  StaffSchedule,
} from "@/features/schedule/types";
import { getScheduleAvailability } from "./availability";

const date = "2026-07-20";
const now = new Date("2026-07-20T08:00:00");
const schedule: StaffSchedule = {
  staffId: "aigerim",
  weeklySchedule: {
    monday: [{ start: "09:00", end: "18:00" }],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  breaks: [],
  daysOff: [],
  vacations: [],
  extraWorkingIntervals: [],
};

function appointment(
  overrides: Partial<ScheduledAppointment> = {},
): ScheduledAppointment {
  return {
    id: "appointment-1",
    staffId: schedule.staffId,
    date,
    time: "09:00",
    durationMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    status: "new",
    ...overrides,
  };
}

describe("getScheduleAvailability", () => {
  it("allows a neighboring 10:00 slot after a 60 minute appointment", () => {
    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "10:00",
        durationMinutes: 60,
        appointments: [appointment()],
        now,
      }),
    ).toEqual({ available: true, reason: "available" });
  });

  it("blocks 10:00 but allows 10:30 when the previous appointment has a 30 minute buffer", () => {
    const appointments = [appointment({ bufferAfterMinutes: 30 })];

    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "10:00",
        durationMinutes: 60,
        appointments,
        now,
      }),
    ).toEqual({ available: false, reason: "appointment_overlap" });
    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "10:30",
        durationMinutes: 60,
        appointments,
        now,
      }),
    ).toEqual({ available: true, reason: "available" });
  });

  it("requires the visible service range to fit inside the shift", () => {
    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "17:00",
        durationMinutes: 60,
        now,
      }).available,
    ).toBe(true);
    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "17:30",
        durationMinutes: 60,
        now,
      }),
    ).toEqual({ available: false, reason: "outside_working_hours" });
  });

  it("rejects a slot whose visible start is in the past", () => {
    expect(
      getScheduleAvailability({
        schedule,
        date,
        time: "09:00",
        durationMinutes: 60,
        now: new Date("2026-07-20T09:01:00"),
      }),
    ).toEqual({ available: false, reason: "past" });
  });
});
