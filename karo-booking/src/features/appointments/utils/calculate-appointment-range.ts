export type CalculateAppointmentRangeInput = {
  startAt: string;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
};

export type AppointmentRange = {
  visibleStartAt: string;
  visibleEndAt: string;
  blockedStartAt: string;
  blockedEndAt: string;
};

const MINUTE_IN_MILLISECONDS = 60_000;

export function calculateAppointmentRange({
  startAt,
  durationMinutes,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
}: CalculateAppointmentRangeInput): AppointmentRange {
  const startTimestamp = Date.parse(startAt);

  if (!Number.isFinite(startTimestamp)) {
    throw new RangeError("startAt must be a valid date-time value.");
  }
  if (!isPositiveNumber(durationMinutes)) {
    throw new RangeError("durationMinutes must be a positive number.");
  }
  if (!isNonNegativeInteger(bufferBeforeMinutes)) {
    throw new RangeError("bufferBeforeMinutes must be a non-negative integer.");
  }
  if (!isNonNegativeInteger(bufferAfterMinutes)) {
    throw new RangeError("bufferAfterMinutes must be a non-negative integer.");
  }

  const visibleEndTimestamp =
    startTimestamp + durationMinutes * MINUTE_IN_MILLISECONDS;

  return {
    visibleStartAt: new Date(startTimestamp).toISOString(),
    visibleEndAt: new Date(visibleEndTimestamp).toISOString(),
    blockedStartAt: new Date(
      startTimestamp - bufferBeforeMinutes * MINUTE_IN_MILLISECONDS,
    ).toISOString(),
    blockedEndAt: new Date(
      visibleEndTimestamp + bufferAfterMinutes * MINUTE_IN_MILLISECONDS,
    ).toISOString(),
  };
}

function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
