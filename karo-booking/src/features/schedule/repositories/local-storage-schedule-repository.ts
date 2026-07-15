import type { AppointmentRepository } from "@/features/appointments/repositories";
import type { StaffRepository } from "@/features/staff/repositories";
import { createDefaultStaffSchedule, defaultStaffSchedules } from "@/features/schedule/data";
import type {
  ExtraWorkingInterval,
  ScheduleBreak,
  ScheduleVacation,
  StaffSchedule,
  TimeInterval,
  Weekday,
} from "@/features/schedule/types";
import { WEEKDAYS } from "@/features/schedule/types";
import {
  getScheduleAvailability,
  isValidDateKey,
  isValidInterval,
  isValidTime,
} from "@/features/schedule/utils";
import {
  browserStorageAdapter,
  type StorageAdapter,
} from "@/lib/storage";
import { canEditStaffSchedule, canViewStaffSchedule } from "@/lib/permissions";
import { LOCAL_STORAGE_KEYS } from "@/repositories/local-schema";
import { repositoryContextToCurrentUser } from "@/repositories/repository-context";
import { repositoryFailureFromStorage } from "@/repositories/repository-storage-error";
import {
  filterByOrganization,
  isDefaultOrganization,
} from "@/repositories/tenant-context";
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryContext,
  type RepositoryResult,
} from "@/repositories/types";
import type {
  ListAvailableSlotsParams,
  ScheduleRepository,
  ScheduleRepositorySubscriber,
} from "./schedule-repository";

const FORBIDDEN_MESSAGE = "Недостаточно прав для выполнения этого действия.";

export class LocalStorageScheduleRepository implements ScheduleRepository {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly staff: StaffRepository,
    private readonly storage: StorageAdapter = browserStorageAdapter,
  ) {}

  async list(context: RepositoryContext): Promise<RepositoryResult<StaffSchedule[]>> {
    if (context.accessMode === "public_booking") {
      return repositoryFailure("forbidden", FORBIDDEN_MESSAGE);
    }
    const schedulesResult = this.readSchedules();
    if (!schedulesResult.ok) return schedulesResult;

    const staffResult = await this.staff.list(context);
    if (!staffResult.ok) return staffResult;
    const visibleStaffIds = new Set(staffResult.data.map((item) => item.id));

    const visibleSchedules = filterByOrganization(
      context,
      schedulesResult.data,
    ).filter((schedule) =>
      visibleStaffIds.has(schedule.staffId) &&
      this.canReadSchedule(context, schedule.staffId),
    );
    return repositorySuccess(visibleSchedules);
  }

  async getByStaffId(
    context: RepositoryContext,
    staffId: string,
  ): Promise<RepositoryResult<StaffSchedule>> {
    if (
      !isDefaultOrganization(context) ||
      context.accessMode === "public_booking" ||
      !staffId ||
      !this.canReadSchedule(context, staffId)
    ) {
      return repositoryFailure("forbidden", FORBIDDEN_MESSAGE);
    }

    const staffResult = await this.staff.getById(context, staffId);
    if (!staffResult.ok) return staffResult;

    const schedulesResult = this.readSchedules();
    if (!schedulesResult.ok) return schedulesResult;

    return repositorySuccess(
      filterByOrganization(context, schedulesResult.data).find(
        (schedule) => schedule.staffId === staffId,
      ) ??
        createDefaultStaffSchedule(staffId),
    );
  }

  async save(
    context: RepositoryContext,
    staffId: string,
    schedule: StaffSchedule,
  ): Promise<RepositoryResult<StaffSchedule>> {
    if (
      !isDefaultOrganization(context) ||
      context.accessMode === "public_booking" ||
      !staffId ||
      !canEditStaffSchedule(repositoryContextToCurrentUser(context), staffId)
    ) {
      return repositoryFailure("forbidden", FORBIDDEN_MESSAGE);
    }

    if (schedule.staffId !== staffId) {
      return repositoryFailure(
        "validation_error",
        "График не соответствует выбранному сотруднику.",
        undefined,
        { staffId, scheduleStaffId: schedule.staffId },
      );
    }

    const normalizedSchedule = parseStaffSchedule(schedule);
    if (!normalizedSchedule) {
      return repositoryFailure(
        "validation_error",
        "Не удалось сохранить график. Проверьте даты и интервалы времени.",
      );
    }

    const schedulesResult = this.readSchedules();
    if (!schedulesResult.ok) return schedulesResult;

    const exists = schedulesResult.data.some((item) => item.staffId === staffId);
    const nextSchedules = exists
      ? schedulesResult.data.map((item) =>
          item.staffId === staffId ? normalizedSchedule : item,
        )
      : [...schedulesResult.data, normalizedSchedule];
    const writeResult = this.storage.set(LOCAL_STORAGE_KEYS.schedules, nextSchedules);
    if (!writeResult.ok) return repositoryFailureFromStorage(writeResult);

    return repositorySuccess(normalizedSchedule);
  }

  async listAvailableSlots(
    context: RepositoryContext,
    params: ListAvailableSlotsParams,
  ): Promise<RepositoryResult<string[]>> {
    const {
      staffId,
      date,
      slots,
      durationMinutes,
      bufferBeforeMinutes = 0,
      bufferAfterMinutes = 0,
      excludeAppointmentId,
      now = new Date(),
    } = params;

    if (!isDefaultOrganization(context)) {
      return repositorySuccess([]);
    }

    if (!this.canReadSchedule(context, staffId)) {
      return repositoryFailure("forbidden", FORBIDDEN_MESSAGE);
    }

    if (
      !staffId ||
      !isValidDateKey(date) ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 ||
      !isValidNonNegativeInteger(bufferBeforeMinutes) ||
      !isValidNonNegativeInteger(bufferAfterMinutes) ||
      Number.isNaN(now.getTime()) ||
      slots.some((slot) => !isValidTime(slot))
    ) {
      return repositoryFailure(
        "validation_error",
        "Проверьте дату, длительность услуги и интервалы времени.",
      );
    }

    const staffResult = context.accessMode === "public_booking"
      ? await this.staff.listPublic(context)
      : await this.staff.list(context);
    if (!staffResult.ok) return staffResult;
    if (!staffResult.data.some((item) => item.id === staffId)) {
      return repositoryFailure("not_found", "Сотрудник недоступен для записи.");
    }

    const schedulesResult = this.readSchedules();
    if (!schedulesResult.ok) return schedulesResult;
    const schedule =
      filterByOrganization(context, schedulesResult.data).find(
        (item) => item.staffId === staffId,
      ) ?? createDefaultStaffSchedule(staffId);

    const scheduleAvailableSlots = slots.filter((time) =>
      getScheduleAvailability({
        schedule,
        date,
        time,
        durationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        now,
      }).available,
    );

    const conflictResults = await Promise.all(
      scheduleAvailableSlots.map(async (time) => {
        const startAt = shiftLocalDateTime(date, time, -bufferBeforeMinutes);
        const endAt = shiftLocalDateTime(
          date,
          time,
          durationMinutes + bufferAfterMinutes,
        );
        const conflictResult = await this.appointments.checkConflict(
          context,
          staffId,
          startAt,
          endAt,
          excludeAppointmentId,
        );
        return { time, conflictResult };
      }),
    );

    const availableSlots: string[] = [];
    for (const { time, conflictResult } of conflictResults) {
      if (!conflictResult.ok) return conflictResult;
      if (!conflictResult.data) availableSlots.push(time);
    }

    return repositorySuccess(availableSlots);
  }

  subscribe(subscriber: ScheduleRepositorySubscriber): () => void {
    return this.storage.subscribe(LOCAL_STORAGE_KEYS.schedules, () => subscriber());
  }

  private readSchedules(): RepositoryResult<StaffSchedule[]> {
    const storageResult = this.storage.get<unknown>(LOCAL_STORAGE_KEYS.schedules);
    if (!storageResult.ok) return repositoryFailureFromStorage(storageResult);
    if (storageResult.data === null) {
      return repositorySuccess(cloneSchedules(defaultStaffSchedules));
    }
    if (!Array.isArray(storageResult.data)) {
      return repositoryFailure(
        "validation_error",
        "Сохранённый график имеет повреждённый формат.",
      );
    }

    const parsedSchedules = storageResult.data.map(parseStaffSchedule);
    if (parsedSchedules.some((schedule) => schedule === null)) {
      return repositoryFailure(
        "validation_error",
        "Сохранённый график имеет повреждённый формат.",
      );
    }
    const storedSchedules = parsedSchedules as StaffSchedule[];
    const storedStaffIds = new Set(storedSchedules.map((schedule) => schedule.staffId));
    return repositorySuccess([
      ...storedSchedules,
      ...cloneSchedules(
        defaultStaffSchedules.filter(
          (schedule) => !storedStaffIds.has(schedule.staffId),
        ),
      ),
    ]);
  }

  private canReadSchedule(context: RepositoryContext, staffId: string): boolean {
    return (
      isDefaultOrganization(context) &&
      (context.accessMode === "public_booking" ||
        canViewStaffSchedule(repositoryContextToCurrentUser(context), staffId))
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimeInterval(value: unknown): value is TimeInterval {
  return (
    isRecord(value) &&
    typeof value.start === "string" &&
    typeof value.end === "string" &&
    isValidInterval({ start: value.start, end: value.end })
  );
}

function isBreak(value: unknown): value is ScheduleBreak {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    isValidDateKey(value.date) &&
    typeof value.title === "string" &&
    isTimeInterval(value)
  );
}

function isVacation(value: unknown): value is ScheduleVacation {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    isValidDateKey(value.startDate) &&
    isValidDateKey(value.endDate) &&
    value.startDate <= value.endDate &&
    (value.title === undefined || typeof value.title === "string")
  );
}

function isExtraWorkingInterval(value: unknown): value is ExtraWorkingInterval {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    isValidDateKey(value.date) &&
    (value.title === undefined || typeof value.title === "string") &&
    isTimeInterval(value)
  );
}

function readWeeklySchedule(
  value: unknown,
): StaffSchedule["weeklySchedule"] | null {
  if (!isRecord(value)) return null;
  const entries = WEEKDAYS.map((weekday) => {
    const intervals = value[weekday];
    return Array.isArray(intervals) && intervals.every(isTimeInterval)
      ? ([weekday, intervals] as const)
      : null;
  });
  if (entries.some((entry) => entry === null)) return null;
  return Object.fromEntries(
    entries as [Weekday, TimeInterval[]][],
  ) as StaffSchedule["weeklySchedule"];
}

function parseStaffSchedule(value: unknown): StaffSchedule | null {
  if (!isRecord(value) || typeof value.staffId !== "string" || !value.staffId) {
    return null;
  }
  const weeklySchedule = readWeeklySchedule(value.weeklySchedule);
  if (!weeklySchedule) return null;
  if (!Array.isArray(value.breaks) || !value.breaks.every(isBreak)) return null;
  if (
    !Array.isArray(value.daysOff) ||
    !value.daysOff.every(
      (date) => typeof date === "string" && isValidDateKey(date),
    )
  ) return null;
  if (!Array.isArray(value.vacations) || !value.vacations.every(isVacation)) {
    return null;
  }
  if (
    !Array.isArray(value.extraWorkingIntervals) ||
    !value.extraWorkingIntervals.every(isExtraWorkingInterval)
  ) return null;

  return {
    staffId: value.staffId,
    weeklySchedule,
    breaks: value.breaks,
    daysOff: [...new Set(value.daysOff)].sort(),
    vacations: value.vacations,
    extraWorkingIntervals: value.extraWorkingIntervals,
  };
}

function cloneSchedules(schedules: readonly StaffSchedule[]): StaffSchedule[] {
  return schedules.map((schedule) => ({
    staffId: schedule.staffId,
    weeklySchedule: Object.fromEntries(
      WEEKDAYS.map((weekday) => [
        weekday,
        schedule.weeklySchedule[weekday].map((interval) => ({ ...interval })),
      ]),
    ) as StaffSchedule["weeklySchedule"],
    breaks: schedule.breaks.map((item) => ({ ...item })),
    daysOff: [...schedule.daysOff],
    vacations: schedule.vacations.map((item) => ({ ...item })),
    extraWorkingIntervals: schedule.extraWorkingIntervals.map((item) => ({
      ...item,
    })),
  }));
}

function isValidNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function shiftLocalDateTime(
  date: string,
  time: string,
  offsetMinutes: number,
): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hours, minutes + offsetMinutes);
  return `${formatNumber(value.getFullYear(), 4)}-${formatNumber(
    value.getMonth() + 1,
  )}-${formatNumber(value.getDate())}T${formatNumber(
    value.getHours(),
  )}:${formatNumber(value.getMinutes())}:00`;
}

function formatNumber(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}
