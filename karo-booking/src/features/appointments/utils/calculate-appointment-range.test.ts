import { describe, expect, it } from "vitest";
import { calculateAppointmentRange } from "./calculate-appointment-range";

describe("calculateAppointmentRange", () => {
  it.each([
    [60, "2026-07-16T10:00:00.000Z"],
    [90, "2026-07-16T10:30:00.000Z"],
    [150, "2026-07-16T11:30:00.000Z"],
  ])("calculates a %i minute visible range", (durationMinutes, visibleEndAt) => {
    const range = calculateAppointmentRange({
      startAt: "2026-07-16T09:00:00.000Z",
      durationMinutes,
    });

    expect(range).toEqual({
      visibleStartAt: "2026-07-16T09:00:00.000Z",
      visibleEndAt,
      blockedStartAt: "2026-07-16T09:00:00.000Z",
      blockedEndAt: visibleEndAt,
    });
  });

  it("keeps buffers outside the visible service range", () => {
    expect(
      calculateAppointmentRange({
        startAt: "2026-07-16T09:00:00.000Z",
        durationMinutes: 60,
        bufferBeforeMinutes: 15,
        bufferAfterMinutes: 30,
      }),
    ).toEqual({
      visibleStartAt: "2026-07-16T09:00:00.000Z",
      visibleEndAt: "2026-07-16T10:00:00.000Z",
      blockedStartAt: "2026-07-16T08:45:00.000Z",
      blockedEndAt: "2026-07-16T10:30:00.000Z",
    });
  });

  it("moves the visible and blocked range across midnight", () => {
    expect(
      calculateAppointmentRange({
        startAt: "2026-07-16T23:30:00.000Z",
        durationMinutes: 90,
        bufferBeforeMinutes: 15,
        bufferAfterMinutes: 30,
      }),
    ).toEqual({
      visibleStartAt: "2026-07-16T23:30:00.000Z",
      visibleEndAt: "2026-07-17T01:00:00.000Z",
      blockedStartAt: "2026-07-16T23:15:00.000Z",
      blockedEndAt: "2026-07-17T01:30:00.000Z",
    });
  });
});
