export type DateTimeInterval = {
  startAt: string;
  endAt: string;
};

export function parseDateTime(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function intervalsOverlap(
  first: DateTimeInterval,
  second: DateTimeInterval,
): boolean {
  const firstStart = parseDateTime(first.startAt);
  const firstEnd = parseDateTime(first.endAt);
  const secondStart = parseDateTime(second.startAt);
  const secondEnd = parseDateTime(second.endAt);

  if (
    firstStart === null ||
    firstEnd === null ||
    secondStart === null ||
    secondEnd === null ||
    firstStart >= firstEnd ||
    secondStart >= secondEnd
  ) {
    return false;
  }

  return firstStart < secondEnd && firstEnd > secondStart;
}
