export type ServiceId = string;

export type BookingService = {
  id: ServiceId;
  name: string;
  durationMinutes: number;
  price: number;
};

export type StaffMember = {
  id: string;
  name: string;
  serviceIds: ServiceId[];
};

export type BookingStatus = "new" | "confirmed" | "in_progress" | "completed" | "cancelled";

export type BookingRecord = {
  id: string;
  serviceId: ServiceId;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  clientName: string;
  contact: string;
  price: number;
  durationMinutes: number;
  comment: string;
  status: BookingStatus;
  createdAt: string;
};

export type CreateBookingResult =
  | { ok: true }
  | { ok: false; reason: "slot_taken" | "schedule_unavailable" | "permission_denied" | "storage_error" };
