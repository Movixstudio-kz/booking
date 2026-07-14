import type { CurrentUser } from "@/types/roles";

type AppointmentOwner = string | { staffId: string };

function getAppointmentStaffId(owner: AppointmentOwner): string {
  return typeof owner === "string" ? owner : owner.staffId;
}

function isOwnStaffRecord(user: CurrentUser, staffId: string): boolean {
  return user.role === "staff" && user.staffId === staffId;
}

export function canCreateAppointment(user: CurrentUser): boolean {
  return user.role === "admin";
}

export function canDeleteAppointments(user: CurrentUser): boolean {
  return user.role === "admin";
}

export function canEditAppointment(user: CurrentUser, owner: AppointmentOwner): boolean {
  void owner;
  return user.role === "admin";
}

export function canChangeAppointmentStatus(user: CurrentUser, owner: AppointmentOwner): boolean {
  const staffId = getAppointmentStaffId(owner);
  return user.role === "admin" || isOwnStaffRecord(user, staffId);
}

export function canViewAppointment(user: CurrentUser, owner: AppointmentOwner): boolean {
  const staffId = getAppointmentStaffId(owner);
  return user.role !== "staff" || isOwnStaffRecord(user, staffId);
}

export function canManageStaff(user: CurrentUser): boolean {
  return user.role === "admin";
}

export function canManageServices(user: CurrentUser): boolean {
  return user.role === "admin";
}

export function canEditStaffSchedule(user: CurrentUser, staffId: string): boolean {
  return user.role === "admin" || isOwnStaffRecord(user, staffId);
}

export function canEditAnySchedule(user: CurrentUser): boolean {
  return user.role === "admin";
}

export function canViewStaffSchedule(user: CurrentUser, staffId: string): boolean {
  return user.role !== "staff" || isOwnStaffRecord(user, staffId);
}
