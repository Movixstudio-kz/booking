"use client";

import { useMemo } from "react";
import { useHydratedStorageState } from "@/hooks";
import { timeSlots } from "@/features/booking/data";
import { loadBookings } from "@/features/booking/services";
import type { BookingRecord } from "@/features/booking/types";
import { defaultServices } from "@/features/services/data";
import { loadServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import { loadStaff } from "@/features/staff/services";
import type { StaffItem } from "@/features/staff/types";

function getToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function isFutureSlot(time: string): boolean {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  return hours > now.getHours() || (hours === now.getHours() && minutes > now.getMinutes());
}

export function useDashboardData() {
  const [appointments] = useHydratedStorageState<BookingRecord[]>([], loadBookings);
  const [staff] = useHydratedStorageState<StaffItem[]>(defaultStaff, loadStaff);
  const [services] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);

  return useMemo(() => {
    const today = getToday();
    const activeStaff = staff.filter((member) => member.isActive);
    const activeServices = services.filter((service) => service.isActive);
    const todayAppointments = appointments.filter((appointment) => appointment.date === today && appointment.status !== "cancelled");
    const futureSlots = timeSlots.filter(isFutureSlot);
    const occupiedKeys = new Set(todayAppointments.map((appointment) => `${appointment.staffId}:${appointment.time}`));
    const freeSlots = activeStaff.reduce((total, member) => total + futureSlots.filter((slot) => !occupiedKeys.has(`${member.id}:${slot}`)).length, 0);

    return { appointments, activeStaff, activeServices, todayAppointments, freeSlots };
  }, [appointments, services, staff]);
}
