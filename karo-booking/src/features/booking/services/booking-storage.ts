import type { BookingRecord, CreateBookingResult } from "@/features/booking/types";

const STORAGE_KEY = "karo-booking:appointments";

function isBookingRecord(value: unknown): value is BookingRecord {
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
    typeof record.createdAt === "string"
  );
}

export function loadBookings(): BookingRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue: unknown = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isBookingRecord) : [];
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
    (booking) => booking.staffId === staffId && booking.date === date && booking.time === time,
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
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}
