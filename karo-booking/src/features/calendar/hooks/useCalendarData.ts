"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppointmentsRepository } from "@/features/appointments/hooks";
import {
  changeAppointmentStatus,
  removeAppointment as removeAppointmentFromRepository,
  saveAppointment as saveAppointmentToRepository,
} from "@/features/appointments/services";
import type { BookingRecord, BookingStatus, CreateBookingResult } from "@/features/booking/types";
import { useStaffSchedules } from "@/features/schedule/hooks";
import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import type { StaffItem } from "@/features/staff/types";
import { repositories } from "@/repositories";
import { canChangeAppointmentStatus, canCreateAppointment, canDeleteAppointments, canEditAppointment, canViewAppointment, canViewStaffSchedule } from "@/lib/permissions";

export function useCalendarData() {
  const {
    currentUser,
    context,
    appointments: allAppointments,
    repositoryError: appointmentsError,
    refresh: refreshAppointments,
  } = useAppointmentsRepository();
  const [staff, setStaff] = useState<StaffItem[]>(defaultStaff);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);
  const [catalogError, setCatalogError] = useState("");
  const { schedules, repositoryError: schedulesError } = useStaffSchedules(context);

  const refreshCatalogs = useCallback(async () => {
    const [staffResult, servicesResult] = await Promise.all([
      repositories.staff.list(context),
      repositories.services.list(context),
    ]);

    if (staffResult.ok) setStaff(staffResult.data);
    if (servicesResult.ok) setServices(servicesResult.data);
    setCatalogError(
      !staffResult.ok
        ? staffResult.error.message
        : !servicesResult.ok
          ? servicesResult.error.message
          : "",
    );
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

  const appointments = allAppointments.filter((appointment) => canViewAppointment(currentUser, appointment));
  const activeStaff = staff.filter((member) => member.isActive && canViewStaffSchedule(currentUser, member.id));

  async function saveAppointment(appointment: BookingRecord, isEditing: boolean): Promise<CreateBookingResult> {
    if (isEditing ? !canEditAppointment(currentUser, appointment) : !canCreateAppointment(currentUser)) {
      return { ok: false, reason: "permission_denied" };
    }
    const result = await saveAppointmentToRepository(context, appointment, isEditing);
    if (result.ok) await refreshAppointments();
    return result;
  }

  async function changeStatus(appointment: BookingRecord, status: BookingStatus): Promise<boolean> {
    if (!canChangeAppointmentStatus(currentUser, appointment)) return false;
    const result = await changeAppointmentStatus(context, appointment.id, status);
    if (!result.ok) return false;
    await refreshAppointments();
    return true;
  }

  async function removeAppointment(id: string): Promise<boolean> {
    if (!canDeleteAppointments(currentUser)) return false;
    const result = await removeAppointmentFromRepository(context, id);
    if (!result.ok) return false;
    await refreshAppointments();
    return true;
  }

  return {
    currentUser,
    appointments,
    activeStaff,
    activeServices: services.filter((service) => service.isActive),
    schedules,
    repositoryError: appointmentsError || catalogError || schedulesError,
    saveAppointment,
    changeStatus,
    removeAppointment,
  };
}
