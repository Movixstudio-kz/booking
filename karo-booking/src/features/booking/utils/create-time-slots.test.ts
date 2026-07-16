import { describe, expect, it } from "vitest";
import { createTimeSlots } from "./create-time-slots";

describe("createTimeSlots", () => {
  it("generates the default day every 30 minutes", () => {
    const slots = createTimeSlots();

    expect(slots.slice(0, 5)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
    ]);
    expect(slots.at(-1)).toBe("20:00");
    expect(slots).toHaveLength(23);
  });

  it("supports a custom step", () => {
    expect(
      createTimeSlots({
        startTime: "09:00",
        endTime: "12:00",
        stepMinutes: 60,
      }),
    ).toEqual(["09:00", "10:00", "11:00", "12:00"]);
  });

  it("generates slots across midnight", () => {
    expect(
      createTimeSlots({
        startTime: "23:00",
        endTime: "01:00",
        stepMinutes: 30,
      }),
    ).toEqual(["23:00", "23:30", "00:00", "00:30", "01:00"]);
  });
});
