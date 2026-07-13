import type { BookingRecord, BookingStatus, CreateBookingResult } from "@/features/booking/types";

const STORAGE_KEY = "karo-booking:appointments";
export const BOOKINGS_CHANGED_EVENT = "karo-booking:appointments-changed";
const statuses: BookingStatus[] = ["new", "confirmed", "in_progress", "completed", "cancelled"];

type LegacyBookingRecord = Omit<BookingRecord, "status"> & { status?: BookingStatus };

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
    return Array.isArray(parsedValue) ? parsedValue.filter(isBookingRecord).map((booking) => ({ ...booking, status: booking.status ?? "new" })) : [];
  } catch {
    return [];
  }
}

export function isSlotBooked(
  bookings: BookingRecord[],
  staffId: string,
  date: string,
  time: string,
): boolean {
  return bookings.some(
    (booking) => booking.status !== "cancelled" && booking.staffId === staffId && booking.date === date && booking.time === time,
  );
}

export function createBooking(booking: BookingRecord): CreateBookingResult {
  if (typeof window === "undefined") return { ok: false, reason: "storage_error" };

  try {
    const currentBookings = loadBookings();

    if (isSlotBooked(currentBookings, booking.staffId, booking.date, booking.time)) {
      return { ok: false, reason: "slot_taken" };
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentBookings, booking]));
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
