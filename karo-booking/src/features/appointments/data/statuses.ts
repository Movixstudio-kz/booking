import type { AppointmentStatusOption } from "@/features/appointments/types";

export const appointmentStatuses: AppointmentStatusOption[] = [
  { value: "new", label: "Новая" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
];
