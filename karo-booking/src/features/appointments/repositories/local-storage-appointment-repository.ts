import {
  canChangeAppointmentStatus,
  canCreateAppointment,
  canDeleteAppointments,
  canEditAppointment,
  canViewAppointment,
  canViewStaffSchedule,
} from "@/lib/permissions";
import type { StorageAdapter } from "@/lib/storage";
import { defaultServices } from "@/features/services/data";
import type {
  BookingRecord,
  BookingStatus,
} from "@/features/booking/types";
import {
  calculateAppointmentRange,
  intervalsOverlap,
  parseDateTime,
} from "@/features/appointments/utils";
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
  AppointmentFilters,
  AppointmentRepository,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./appointment-repository";

const statuses: readonly BookingStatus[] = [
  "new",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

type LegacyBookingRecord = Omit<
  BookingRecord,
  | "status"
  | "durationMinutes"
  | "bufferBeforeMinutes"
  | "bufferAfterMinutes"
  | "comment"
> & {
  status?: BookingStatus;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  comment?: string;
};

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `appointment-${Date.now()}`;
}

function isLegacyBookingRecord(value: unknown): value is LegacyBookingRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.serviceId === "string" &&
    typeof record.serviceName === "string" &&
    typeof record.staffId === "string" &&
    typeof record.staffName === "string" &&
    typeof record.date === "string" &&
    typeof record.time === "string" &&
    typeof record.clientName === "string" &&
    typeof record.contact === "string" &&
    typeof record.price === "number" &&
    (record.durationMinutes === undefined ||
      typeof record.durationMinutes === "number") &&
    (record.bufferBeforeMinutes === undefined ||
      typeof record.bufferBeforeMinutes === "number") &&
    (record.bufferAfterMinutes === undefined ||
      typeof record.bufferAfterMinutes === "number") &&
    (record.comment === undefined || typeof record.comment === "string") &&
    (record.status === undefined ||
      (typeof record.status === "string" &&
        statuses.includes(record.status as BookingStatus))) &&
    typeof record.createdAt === "string"
  );
}

function normalizeBooking(record: LegacyBookingRecord): BookingRecord {
  const service = defaultServices.find((item) => item.id === record.serviceId);
  return {
    ...record,
    durationMinutes:
      record.durationMinutes ?? service?.durationMinutes ?? 60,
    bufferBeforeMinutes:
      record.bufferBeforeMinutes ?? service?.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes:
      record.bufferAfterMinutes ?? service?.bufferAfterMinutes ?? 0,
    comment: record.comment ?? "",
    status: record.status ?? "new",
  };
}

function isValidBooking(record: BookingRecord): boolean {
  const startAt = `${record.date}T${record.time}:00`;
  return (
    record.id.trim().length > 0 &&
    record.serviceId.trim().length > 0 &&
    record.serviceName.trim().length > 0 &&
    record.staffId.trim().length > 0 &&
    record.staffName.trim().length > 0 &&
    record.clientName.trim().length > 0 &&
    record.contact.trim().length > 0 &&
    Number.isFinite(record.price) &&
    record.price >= 0 &&
    Number.isFinite(record.durationMinutes) &&
    record.durationMinutes > 0 &&
    Number.isInteger(record.bufferBeforeMinutes) &&
    record.bufferBeforeMinutes >= 0 &&
    Number.isInteger(record.bufferAfterMinutes) &&
    record.bufferAfterMinutes >= 0 &&
    statuses.includes(record.status) &&
    parseDateTime(startAt) !== null &&
    parseDateTime(record.createdAt) !== null
  );
}

function appointmentInterval(booking: BookingRecord) {
  const range = calculateAppointmentRange({
    startAt: `${booking.date}T${booking.time}:00`,
    durationMinutes: booking.durationMinutes,
    bufferBeforeMinutes: booking.bufferBeforeMinutes,
    bufferAfterMinutes: booking.bufferAfterMinutes,
  });

  return {
    startAt: range.blockedStartAt,
    endAt: range.blockedEndAt,
  };
}

function matchesFilters(
  appointment: BookingRecord,
  filters?: AppointmentFilters,
): boolean {
  if (!filters) return true;
  if (filters.staffId && appointment.staffId !== filters.staffId) return false;
  if (filters.date && appointment.date !== filters.date) return false;
  if (filters.dateFrom && appointment.date < filters.dateFrom) return false;
  if (filters.dateTo && appointment.date > filters.dateTo) return false;
  if (filters.status && appointment.status !== filters.status) return false;
  if (filters.statuses && !filters.statuses.includes(appointment.status)) {
    return false;
  }
  return true;
}

export class LocalStorageAppointmentRepository
  implements AppointmentRepository
{
  constructor(private readonly storage: StorageAdapter) {}

  subscribe(subscriber: () => void): () => void {
    return this.storage.subscribe(
      LOCAL_STORAGE_KEYS.appointments,
      () => subscriber(),
    );
  }

  async list(
    context: RepositoryContext,
    filters?: AppointmentFilters,
  ): Promise<RepositoryResult<BookingRecord[]>> {
    if (context.accessMode === "public_booking") {
      return repositoryFailure("forbidden");
    }

    const stored = this.readAll();
    if (!stored.ok) return stored;
    const user = repositoryContextToCurrentUser(context);
    return repositorySuccess(
      filterByOrganization(context, stored.data).filter(
        (appointment) =>
          canViewAppointment(user, appointment) &&
          matchesFilters(appointment, filters),
      ),
    );
  }

  async getById(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<BookingRecord>> {
    if (context.accessMode === "public_booking") {
      return repositoryFailure("forbidden");
    }

    const stored = this.readAll();
    if (!stored.ok) return stored;
    const appointment = filterByOrganization(context, stored.data).find(
      (item) => item.id === id,
    );
    if (!appointment) return repositoryFailure("not_found");
    if (
      !canViewAppointment(repositoryContextToCurrentUser(context), appointment)
    ) {
      return repositoryFailure("forbidden");
    }
    return repositorySuccess(appointment);
  }

  async create(
    context: RepositoryContext,
    input: CreateAppointmentInput,
  ): Promise<RepositoryResult<BookingRecord>> {
    const user = repositoryContextToCurrentUser(context);
    if (
      !isDefaultOrganization(context) ||
      (context.accessMode === "public_booking"
        ? input.status !== "new"
        : !canCreateAppointment(user))
    ) {
      return repositoryFailure("forbidden");
    }

    const appointment: BookingRecord = {
      ...input,
      id: input.id ?? createId(),
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    if (!isValidBooking(appointment)) {
      return repositoryFailure("validation_error");
    }

    return this.storage.withLock(LOCAL_STORAGE_KEYS.appointments, () => {
      const stored = this.readAll();
      if (!stored.ok) return stored;
      const tenantAppointments = filterByOrganization(context, stored.data);
      if (tenantAppointments.some((item) => item.id === appointment.id)) {
        return repositoryFailure(
          "conflict",
          "Запись с таким идентификатором уже существует.",
        );
      }
      if (this.hasConflict(tenantAppointments, appointment)) {
        return repositoryFailure("conflict");
      }

      const write = this.storage.set(LOCAL_STORAGE_KEYS.appointments, [
        ...stored.data,
        appointment,
      ]);
      if (!write.ok) return repositoryFailureFromStorage(write);
      return repositorySuccess(appointment);
    });
  }

  async update(
    context: RepositoryContext,
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<RepositoryResult<BookingRecord>> {
    if (
      !isDefaultOrganization(context) ||
      context.accessMode === "public_booking"
    ) {
      return repositoryFailure("forbidden");
    }

    return this.storage.withLock(LOCAL_STORAGE_KEYS.appointments, () => {
      const stored = this.readAll();
      if (!stored.ok) return stored;
      const tenantAppointments = filterByOrganization(context, stored.data);
      const index = tenantAppointments.findIndex((item) => item.id === id);
      if (index < 0) return repositoryFailure("not_found");
      const previous = tenantAppointments[index];
      if (
        !canEditAppointment(repositoryContextToCurrentUser(context), previous)
      ) {
        return repositoryFailure("forbidden");
      }

      const appointment = {
        ...previous,
        ...input,
        id,
        createdAt: previous.createdAt,
      };
      if (!isValidBooking(appointment)) {
        return repositoryFailure("validation_error");
      }
      if (this.hasConflict(stored.data, appointment, id)) {
        return repositoryFailure("conflict");
      }

      const next = [...stored.data];
      next[index] = appointment;
      const write = this.storage.set(LOCAL_STORAGE_KEYS.appointments, next);
      if (!write.ok) return repositoryFailureFromStorage(write);
      return repositorySuccess(appointment);
    });
  }

  async updateStatus(
    context: RepositoryContext,
    id: string,
    status: BookingStatus,
  ): Promise<RepositoryResult<BookingRecord>> {
      if (
      !isDefaultOrganization(context) ||
      context.accessMode === "public_booking" ||
      !statuses.includes(status)
    ) {
      return repositoryFailure(
        context.accessMode === "public_booking"
          ? "forbidden"
          : "validation_error",
      );
    }

    return this.storage.withLock(LOCAL_STORAGE_KEYS.appointments, () => {
      const stored = this.readAll();
      if (!stored.ok) return stored;
      const tenantAppointments = filterByOrganization(context, stored.data);
      const index = tenantAppointments.findIndex((item) => item.id === id);
      if (index < 0) return repositoryFailure("not_found");
      const previous = tenantAppointments[index];
      if (
        !canChangeAppointmentStatus(
          repositoryContextToCurrentUser(context),
          previous,
        )
      ) {
        return repositoryFailure("forbidden");
      }

      const appointment = { ...previous, status };
      const next = [...stored.data];
      next[index] = appointment;
      const write = this.storage.set(LOCAL_STORAGE_KEYS.appointments, next);
      if (!write.ok) return repositoryFailureFromStorage(write);
      return repositorySuccess(appointment);
    });
  }

  async delete(
    context: RepositoryContext,
    id: string,
  ): Promise<RepositoryResult<void>> {
    if (
      context.accessMode === "public_booking" ||
      !isDefaultOrganization(context) ||
      !canDeleteAppointments(repositoryContextToCurrentUser(context))
    ) {
      return repositoryFailure("forbidden");
    }

    return this.storage.withLock(LOCAL_STORAGE_KEYS.appointments, () => {
      const stored = this.readAll();
      if (!stored.ok) return stored;
      const tenantAppointments = filterByOrganization(context, stored.data);
      if (!tenantAppointments.some((item) => item.id === id)) {
        return repositoryFailure("not_found");
      }
      const write = this.storage.set(
        LOCAL_STORAGE_KEYS.appointments,
        stored.data.filter((item) => item.id !== id),
      );
      if (!write.ok) return repositoryFailureFromStorage(write);
      return repositorySuccess(undefined);
    });
  }

  async checkConflict(
    context: RepositoryContext,
    staffId: string,
    startAt: string,
    endAt: string,
    excludeAppointmentId?: string,
  ): Promise<RepositoryResult<boolean>> {
    const user = repositoryContextToCurrentUser(context);
    if (!isDefaultOrganization(context)) {
      return repositorySuccess(false);
    }
    if (
      context.accessMode !== "public_booking" &&
      !canViewStaffSchedule(user, staffId)
    ) {
      return repositoryFailure("forbidden");
    }
    const start = parseDateTime(startAt);
    const end = parseDateTime(endAt);
    if (start === null || end === null || start >= end) {
      return repositoryFailure("validation_error");
    }

    const stored = this.readAll();
    if (!stored.ok) return stored;
    return repositorySuccess(
      filterByOrganization(context, stored.data).some(
        (appointment) =>
          appointment.id !== excludeAppointmentId &&
          appointment.status !== "cancelled" &&
          appointment.staffId === staffId &&
          intervalsOverlap(
            { startAt, endAt },
            appointmentInterval(appointment),
          ),
      ),
    );
  }

  private readAll(): RepositoryResult<BookingRecord[]> {
    const read = this.storage.get<unknown>(LOCAL_STORAGE_KEYS.appointments);
    if (!read.ok) return repositoryFailureFromStorage(read);
    if (read.data === null) return repositorySuccess([]);
    if (
      !Array.isArray(read.data) ||
      !read.data.every(isLegacyBookingRecord)
    ) {
      return repositoryFailure("validation_error");
    }
    return repositorySuccess(read.data.map(normalizeBooking));
  }

  private hasConflict(
    appointments: readonly BookingRecord[],
    candidate: BookingRecord,
    excludeAppointmentId?: string,
  ): boolean {
    const candidateInterval = appointmentInterval(candidate);
    return appointments.some(
      (appointment) =>
        appointment.id !== excludeAppointmentId &&
        appointment.status !== "cancelled" &&
        appointment.staffId === candidate.staffId &&
        intervalsOverlap(candidateInterval, appointmentInterval(appointment)),
    );
  }
}
