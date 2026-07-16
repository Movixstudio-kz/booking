export type CreateTimeSlotsOptions = {
  startTime?: string;
  endTime?: string;
  stepMinutes?: number;
};

const MINUTES_PER_DAY = 24 * 60;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function createTimeSlots({
  startTime = "09:00",
  endTime = "20:00",
  stepMinutes = 30,
}: CreateTimeSlotsOptions = {}): string[] {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw new RangeError("startTime and endTime must use the HH:mm format.");
  }
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) {
    throw new RangeError("stepMinutes must be a positive integer.");
  }

  const startMinutes = timeToMinutes(startTime);
  const parsedEndMinutes = timeToMinutes(endTime);
  const endMinutes =
    parsedEndMinutes < startMinutes
      ? parsedEndMinutes + MINUTES_PER_DAY
      : parsedEndMinutes;
  const slots: string[] = [];

  for (
    let minutes = startMinutes;
    minutes <= endMinutes;
    minutes += stepMinutes
  ) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const normalizedMinutes = totalMinutes % MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
