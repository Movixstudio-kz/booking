import type { BookingRecord, BookingStatus, CreateBookingResult } from "@/features/booking/types";
import { loadStaffSchedule } from "@/features/schedule/services";
import { getScheduleAvailability } from "@/features/schedule/utils";
import { defaultServices } from "@/features/services/data";

const STORAGE_KEY = "karo-booking:appointments";
export const BOOKINGS_CHANGED_EVENT = "karo-booking:appointments-changed";
const statuses: BookingStatus[] = ["new", "confirmed", "in_progress", "completed", "cancelled"];

type LegacyBookingRecord = Omit<BookingRecord, "status" | "durationMinutes" | "comment"> & {
  status?: BookingStatus;
  durationMinutes?: number;
  comment?: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isBookingRecord(value: unknown): value is LegacyBookingRecord {
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
    (record.durationMinutes === undefined || typeof record.durationMinutes === "number") &&
    (record.comment === undefined || typeof record.comment === "string") &&
    (record.status === undefined || (typeof record.status === "string" && statuses.includes(record.status as BookingStatus))) &&
    typeof record.createdAt === "string"
  );
}

export function loadBookings(): BookingRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue: unknown = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isBookingRecord).map((booking) => ({
      ...booking,
      durationMinutes: booking.durationMinutes ?? defaultServices.find((service) => service.id === booking.serviceId)?.durationMinutes ?? 60,
      comment: booking.comment ?? "",
      status: booking.status ?? "new",
    })) : [];
  } catch {
    return [];
  }
}

export function isSlotBooked(
  bookings: BookingRecord[],
  staffId: string,
  date: string,
  time: string,
  durationMinutes = 1,
  excludeBookingId?: string,
): boolean {
  const start = timeToMinutes(time);
  const end = start + durationMinutes;
  return bookings.some((booking) => {
    if (booking.id === excludeBookingId || booking.status === "cancelled" || booking.staffId !== staffId || booking.date !== date) return false;
    const bookingStart = timeToMinutes(booking.time);
    const bookingEnd = bookingStart + booking.durationMinutes;
    return start < bookingEnd && end > bookingStart;
  });
}

export function createBooking(booking: BookingRecord): CreateBookingResult {
  if (typeof window === "undefined") return { ok: false, reason: "storage_error" };

  try {
    const currentBookings = loadBookings();
    const availability = getScheduleAvailability({
      schedule: loadStaffSchedule(booking.staffId),
      date: booking.date,
      time: booking.time,
      durationMinutes: booking.durationMinutes,
      appointments: currentBookings,
    });

    if (!availability.available) {
      return { ok: false, reason: availability.reason === "appointment_overlap" ? "slot_taken" : "schedule_unavailable" };
    }

    if (isSlotBooked(currentBookings, booking.staffId, booking.date, booking.time, booking.durationMinutes)) {
      return { ok: false, reason: "slot_taken" };
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentBookings, booking]));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

export function updateBooking(booking: BookingRecord): CreateBookingResult {
  if (typeof window === "undefined") return { ok: false, reason: "storage_error" };
  try {
    const currentBookings = loadBookings();
    const previousBooking = currentBookings.find((item) => item.id === booking.id);
    const scheduleChanged = !previousBooking || previousBooking.staffId !== booking.staffId || previousBooking.date !== booking.date || previousBooking.time !== booking.time || previousBooking.durationMinutes !== booking.durationMinutes;
    if (scheduleChanged) {
      const availability = getScheduleAvailability({
        schedule: loadStaffSchedule(booking.staffId),
        date: booking.date,
        time: booking.time,
        durationMinutes: booking.durationMinutes,
        appointments: currentBookings,
        excludeAppointmentId: booking.id,
      });
      if (!availability.available) {
        return { ok: false, reason: availability.reason === "appointment_overlap" ? "slot_taken" : "schedule_unavailable" };
      }
    }
    if (isSlotBooked(currentBookings, booking.staffId, booking.date, booking.time, booking.durationMinutes, booking.id)) {
      return { ok: false, reason: "slot_taken" };
    }
    const nextBookings = currentBookings.map((item) => item.id === booking.id ? booking : item);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

export function updateBookingStatus(id: string, status: BookingStatus): boolean {
  try {
    const nextBookings = loadBookings().map((booking) => booking.id === id ? { ...booking, status } : booking);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function deleteBooking(id: string): boolean {
  try {
    const nextBookings = loadBookings().filter((booking) => booking.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
    window.dispatchEvent(new Event(BOOKINGS_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}
