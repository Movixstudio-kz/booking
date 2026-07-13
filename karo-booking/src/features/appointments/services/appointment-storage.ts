import { deleteBooking, loadBookings, updateBookingStatus } from "@/features/booking/services";
import type { BookingStatus } from "@/features/booking/types";

export const loadAppointments = loadBookings;
export const removeAppointment = deleteBooking;

export function changeAppointmentStatus(id: string, status: BookingStatus): boolean {
  return updateBookingStatus(id, status);
}
