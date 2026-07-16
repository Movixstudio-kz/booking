import { describe, expect, it } from "vitest";
import { intervalsOverlap } from "./interval-overlap";

describe("intervalsOverlap", () => {
  it("does not treat adjacent intervals as overlapping", () => {
    expect(
      intervalsOverlap(
        {
          startAt: "2026-07-16T09:00:00.000Z",
          endAt: "2026-07-16T10:00:00.000Z",
        },
        {
          startAt: "2026-07-16T10:00:00.000Z",
          endAt: "2026-07-16T11:00:00.000Z",
        },
      ),
    ).toBe(false);
  });

  it("detects a real intersection", () => {
    expect(
      intervalsOverlap(
        {
          startAt: "2026-07-16T09:00:00.000Z",
          endAt: "2026-07-16T10:30:00.000Z",
        },
        {
          startAt: "2026-07-16T10:00:00.000Z",
          endAt: "2026-07-16T11:00:00.000Z",
        },
      ),
    ).toBe(true);
  });
});
