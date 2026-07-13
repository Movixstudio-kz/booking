export type ServiceId = "manicure" | "pedicure" | "haircut" | "coloring";

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
  createdAt: string;
};

export type CreateBookingResult =
  | { ok: true }
  | { ok: false; reason: "slot_taken" | "storage_error" };
