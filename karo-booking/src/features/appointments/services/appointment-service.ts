import type {
  AppointmentFilters,
  UpdateAppointmentInput,
} from "@/features/appointments/repositories";
import type {
  BookingRecord,
  BookingStatus,
  CreateBookingResult,
} from "@/features/booking/types";
import { calculateAppointmentRange } from "@/features/appointments/utils";
import { repositories } from "@/repositories";
import type {
  RepositoryContext,
  RepositoryResult,
} from "@/repositories/types";

export function listAppointments(
  context: RepositoryContext,
  filters?: AppointmentFilters,
): Promise<RepositoryResult<BookingRecord[]>> {
  return repositories.appointments.list(context, filters);
}

export async function saveAppointment(
  context: RepositoryContext,
  appointment: BookingRecord,
  isEditing: boolean,
): Promise<CreateBookingResult> {
  const range = calculateAppointmentRange({
    startAt: `${appointment.date}T${appointment.time}:00`,
    durationMinutes: appointment.durationMinutes,
    bufferBeforeMinutes: appointment.bufferBeforeMinutes,
    bufferAfterMinutes: appointment.bufferAfterMinutes,
  });
  const conflict = await repositories.appointments.checkConflict(
    context,
    appointment.staffId,
    range.blockedStartAt,
    range.blockedEndAt,
    isEditing ? appointment.id : undefined,
  );

  if (!conflict.ok) return mapRepositoryFailure(conflict);
  if (conflict.data) return { ok: false, reason: "slot_taken" };

  const availability = await repositories.schedules.listAvailableSlots(context, {
    staffId: appointment.staffId,
    date: appointment.date,
    slots: [appointment.time],
    durationMinutes: appointment.durationMinutes,
    bufferBeforeMinutes: appointment.bufferBeforeMinutes,
    bufferAfterMinutes: appointment.bufferAfterMinutes,
    excludeAppointmentId: isEditing ? appointment.id : undefined,
  });

  if (!availability.ok) return mapRepositoryFailure(availability);
  if (!availability.data.includes(appointment.time)) {
    return { ok: false, reason: "schedule_unavailable" };
  }

  const result = isEditing
    ? await repositories.appointments.update(
        context,
        appointment.id,
        appointment as UpdateAppointmentInput,
      )
    : await repositories.appointments.create(context, appointment);

  if (!result.ok) return mapRepositoryFailure(result);
  return { ok: true };
}

export function changeAppointmentStatus(
  context: RepositoryContext,
  id: string,
  status: BookingStatus,
): Promise<RepositoryResult<BookingRecord>> {
  return repositories.appointments.updateStatus(context, id, status);
}

export function removeAppointment(
  context: RepositoryContext,
  id: string,
): Promise<RepositoryResult<void>> {
  return repositories.appointments.delete(context, id);
}

function mapRepositoryFailure(
  result: Extract<RepositoryResult<unknown>, { ok: false }>,
): CreateBookingResult {
  if (result.error.code === "conflict") {
    return { ok: false, reason: "slot_taken" };
  }
  if (result.error.code === "forbidden") {
    return { ok: false, reason: "permission_denied" };
  }
  if (result.error.code === "validation_error") {
    return { ok: false, reason: "schedule_unavailable" };
  }
  return { ok: false, reason: "storage_error" };
}
