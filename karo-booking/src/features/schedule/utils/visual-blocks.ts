import type { ScheduleVisualBlock, StaffSchedule, TimeInterval } from "@/features/schedule/types";
import { getWorkingIntervalsForDate, isDateInVacation } from "./availability";
import { clampInterval, mergeIntervals, minutesToTime, timeToMinutes } from "./time";

export function getScheduleVisualBlocks(
  schedule: StaffSchedule,
  date: string,
  visibleStart = "09:00",
  visibleEnd = "20:00",
): ScheduleVisualBlock[] {
  const boundary = { start: visibleStart, end: visibleEnd };

  if (isDateInVacation(schedule, date)) {
    return [{ id: `vacation-${schedule.staffId}-${date}`, kind: "vacation", title: "Отпуск", ...boundary }];
  }

  const dayOff = schedule.daysOff.includes(date);
  const workingIntervals = mergeIntervals(
    getWorkingIntervalsForDate(schedule, date)
      .map((interval) => clampInterval(interval, boundary))
      .filter((interval): interval is TimeInterval => interval !== null),
  );

  const gaps: ScheduleVisualBlock[] = [];
  let cursor = timeToMinutes(visibleStart);
  const boundaryEnd = timeToMinutes(visibleEnd);

  for (const interval of workingIntervals) {
    const intervalStart = timeToMinutes(interval.start);
    if (cursor < intervalStart) {
      gaps.push(createGap(schedule.staffId, date, gaps.length, cursor, intervalStart, dayOff));
    }
    cursor = Math.max(cursor, timeToMinutes(interval.end));
  }

  if (cursor < boundaryEnd) gaps.push(createGap(schedule.staffId, date, gaps.length, cursor, boundaryEnd, dayOff));

  const breaks = schedule.breaks
    .filter((item) => item.date === date)
    .map<ScheduleVisualBlock | null>((item) => {
      const interval = clampInterval(item, boundary);
      if (!interval) return null;
      return {
        id: item.id,
        kind: "break" as const,
        title: item.title || "Перерыв",
        ...interval,
      };
    })
    .filter((block): block is ScheduleVisualBlock => block !== null);

  return [...gaps, ...breaks].sort((first, second) => timeToMinutes(first.start) - timeToMinutes(second.start));
}

export const getScheduleBlocksForDate = getScheduleVisualBlocks;

function createGap(
  staffId: string,
  date: string,
  index: number,
  start: number,
  end: number,
  dayOff: boolean,
): ScheduleVisualBlock {
  return {
    id: `schedule-gap-${staffId}-${date}-${index}`,
    kind: dayOff ? "day_off" : "non_working",
    title: dayOff ? "Выходной" : "Нерабочее время",
    start: minutesToTime(start),
    end: minutesToTime(end),
  };
}
