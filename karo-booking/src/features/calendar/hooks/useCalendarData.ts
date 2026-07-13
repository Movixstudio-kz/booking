"use client";

import { useHydratedStorageState } from "@/hooks";
import { createBooking, deleteBooking, loadBookings, updateBooking } from "@/features/booking/services";
import type { BookingRecord, CreateBookingResult } from "@/features/booking/types";
import { defaultServices } from "@/features/services/data";
import { loadServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import { loadStaff } from "@/features/staff/services";
import type { StaffItem } from "@/features/staff/types";

export function useCalendarData() {
  const [appointments, setAppointments] = useHydratedStorageState<BookingRecord[]>([], loadBookings);
  const [staff] = useHydratedStorageState<StaffItem[]>(defaultStaff, loadStaff);
  const [services] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);

  function saveAppointment(appointment: BookingRecord, isEditing: boolean): CreateBookingResult {
    const result = isEditing ? updateBooking(appointment) : createBooking(appointment);
    if (result.ok) setAppointments(loadBookings());
    return result;
  }

  function removeAppointment(id: string): boolean {
    const result = deleteBooking(id);
    if (result) setAppointments(loadBookings());
    return result;
  }

  return { appointments, activeStaff: staff.filter((member) => member.isActive), activeServices: services.filter((service) => service.isActive), saveAppointment, removeAppointment };
}
