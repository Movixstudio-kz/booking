"use client";

import { createBooking, deleteBooking, loadBookings, updateBooking, updateBookingStatus } from "@/features/booking/services";
import type { BookingRecord, BookingStatus, CreateBookingResult } from "@/features/booking/types";
import { useStaffSchedules } from "@/features/schedule/hooks";
import { defaultServices } from "@/features/services/data";
import { loadServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import { loadStaff } from "@/features/staff/services";
import type { StaffItem } from "@/features/staff/types";
import { useCurrentUser, useHydratedStorageState } from "@/hooks";
import { canChangeAppointmentStatus, canCreateAppointment, canDeleteAppointments, canEditAppointment, canViewAppointment, canViewStaffSchedule } from "@/lib/permissions";

export function useCalendarData() {
  const { currentUser } = useCurrentUser();
  const [allAppointments, setAppointments] = useHydratedStorageState<BookingRecord[]>([], loadBookings);
  const [staff] = useHydratedStorageState<StaffItem[]>(defaultStaff, loadStaff);
  const [services] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);
  const { schedules } = useStaffSchedules();

  const appointments = allAppointments.filter((appointment) => canViewAppointment(currentUser, appointment));
  const activeStaff = staff.filter((member) => member.isActive && canViewStaffSchedule(currentUser, member.id));

  function saveAppointment(appointment: BookingRecord, isEditing: boolean): CreateBookingResult {
    if (isEditing ? !canEditAppointment(currentUser, appointment) : !canCreateAppointment(currentUser)) {
      return { ok: false, reason: "permission_denied" };
    }
    const result = isEditing ? updateBooking(appointment) : createBooking(appointment);
    if (result.ok) setAppointments(loadBookings());
    return result;
  }

  function changeStatus(appointment: BookingRecord, status: BookingStatus): boolean {
    if (!canChangeAppointmentStatus(currentUser, appointment)) return false;
    const result = updateBookingStatus(appointment.id, status);
    if (result) setAppointments(loadBookings());
    return result;
  }

  function removeAppointment(id: string): boolean {
    if (!canDeleteAppointments(currentUser)) return false;
    const result = deleteBooking(id);
    if (result) setAppointments(loadBookings());
    return result;
  }

  return {
    currentUser,
    appointments,
    activeStaff,
    activeServices: services.filter((service) => service.isActive),
    schedules,
    saveAppointment,
    changeStatus,
    removeAppointment,
  };
}
