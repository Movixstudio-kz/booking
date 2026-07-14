"use client";

import { useMemo } from "react";
import { timeSlots } from "@/features/booking/data";
import { loadBookings } from "@/features/booking/services";
import type { BookingRecord } from "@/features/booking/types";
import { useStaffSchedules } from "@/features/schedule/hooks";
import { getScheduleAvailability } from "@/features/schedule/utils";
import { defaultServices } from "@/features/services/data";
import { loadServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import { loadStaff } from "@/features/staff/services";
import type { StaffItem } from "@/features/staff/types";
import { useCurrentUser, useHydratedStorageState } from "@/hooks";
import { canViewAppointment, canViewStaffSchedule } from "@/lib/permissions";

function getToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function useDashboardData() {
  const { currentUser } = useCurrentUser();
  const [allAppointments] = useHydratedStorageState<BookingRecord[]>([], loadBookings);
  const [staff] = useHydratedStorageState<StaffItem[]>(defaultStaff, loadStaff);
  const [services] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);
  const { getSchedule } = useStaffSchedules();

  return useMemo(() => {
    const today = getToday();
    const appointments = allAppointments.filter((appointment) => canViewAppointment(currentUser, appointment));
    const activeStaff = staff.filter((member) => member.isActive && canViewStaffSchedule(currentUser, member.id));
    const activeServices = services.filter((service) => service.isActive);
    const todayAppointments = appointments.filter((appointment) => appointment.date === today && appointment.status !== "cancelled");
    const freeSlots = activeStaff.reduce((total, member) => total + timeSlots.filter((time) => getScheduleAvailability({ schedule: getSchedule(member.id), date: today, time, durationMinutes: 30, appointments: allAppointments }).available).length, 0);

    return { currentUser, appointments, activeStaff, activeServices, todayAppointments, freeSlots };
  }, [allAppointments, currentUser, getSchedule, services, staff]);
}
