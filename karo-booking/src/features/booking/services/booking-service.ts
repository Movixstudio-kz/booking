import { saveAppointment } from "@/features/appointments/services";
import type { BookingRecord, CreateBookingResult } from "@/features/booking/types";
import type { ListAvailableSlotsParams } from "@/features/schedule/repositories";
import type { StaffSchedule } from "@/features/schedule/types";
import type { ServiceItem } from "@/features/services/types";
import type { PublicStaffItem } from "@/features/staff/types";
import { publicBookingContext, repositories } from "@/repositories";
import type { RepositoryResult } from "@/repositories/types";

export function loadPublicServices(): Promise<RepositoryResult<ServiceItem[]>> {
  return repositories.services.list(publicBookingContext, {
    activeOnly: true,
    onlineBookingOnly: true,
  });
}

export function loadPublicStaff(): Promise<RepositoryResult<PublicStaffItem[]>> {
  return repositories.staff.listPublic(publicBookingContext);
}

export function loadPublicSchedule(
  staffId: string,
): Promise<RepositoryResult<StaffSchedule>> {
  return repositories.schedules.getByStaffId(publicBookingContext, staffId);
}

export function loadPublicAvailableSlots(
  params: ListAvailableSlotsParams,
): Promise<RepositoryResult<string[]>> {
  return repositories.schedules.listAvailableSlots(publicBookingContext, params);
}

export function createBooking(
  booking: BookingRecord,
): Promise<CreateBookingResult> {
  return createCanonicalPublicBooking(booking);
}

async function createCanonicalPublicBooking(
  booking: BookingRecord,
): Promise<CreateBookingResult> {
  const [servicesResult, staffResult] = await Promise.all([
    loadPublicServices(),
    loadPublicStaff(),
  ]);
  if (!servicesResult.ok || !staffResult.ok) {
    return { ok: false, reason: "storage_error" };
  }

  const service = servicesResult.data.find((item) => item.id === booking.serviceId);
  const staff = staffResult.data.find((item) => item.id === booking.staffId);
  if (!service || !staff || !staff.serviceIds.includes(service.id)) {
    return { ok: false, reason: "schedule_unavailable" };
  }

  return saveAppointment(publicBookingContext, {
    ...booking,
    serviceName: service.name,
    staffName: staff.name,
    price: service.price,
    durationMinutes: service.durationMinutes,
    bufferBeforeMinutes: service.bufferBeforeMinutes,
    bufferAfterMinutes: service.bufferAfterMinutes,
    status: "new",
    comment: "",
    createdAt: new Date().toISOString(),
  }, false);
}

export function subscribeToPublicBookingData(
  subscriber: () => void,
): () => void {
  const unsubscribers = [
    repositories.appointments.subscribe(subscriber),
    repositories.staff.subscribe(subscriber),
    repositories.services.subscribe(subscriber),
    repositories.schedules.subscribe(subscriber),
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
