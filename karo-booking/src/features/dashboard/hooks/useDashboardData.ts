"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppointmentsRepository } from "@/features/appointments/hooks";
import { timeSlots } from "@/features/booking/data";
import { useStaffSchedules } from "@/features/schedule/hooks";
import { getScheduleAvailability } from "@/features/schedule/utils";
import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import type { StaffItem } from "@/features/staff/types";
import { canViewAppointment, canViewStaffSchedule } from "@/lib/permissions";
import { repositories } from "@/repositories";

function getToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function useDashboardData() {
  const { currentUser, context, appointments: allAppointments } = useAppointmentsRepository();
  const [staff, setStaff] = useState<StaffItem[]>(defaultStaff);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);
  const { getSchedule } = useStaffSchedules(context);

  const refreshCatalogs = useCallback(async () => {
    const [staffResult, servicesResult] = await Promise.all([
      repositories.staff.list(context),
      repositories.services.list(context),
    ]);
    if (staffResult.ok) setStaff(staffResult.data);
    if (servicesResult.ok) setServices(servicesResult.data);
  }, [context]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refreshCatalogs();
    });
    const unsubscribeStaff = repositories.staff.subscribe(() => {
      void refreshCatalogs();
    });
    const unsubscribeServices = repositories.services.subscribe(() => {
      void refreshCatalogs();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribeStaff();
      unsubscribeServices();
    };
  }, [refreshCatalogs]);

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
