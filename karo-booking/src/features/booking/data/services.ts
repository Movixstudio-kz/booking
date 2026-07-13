import type { BookingService } from "@/features/booking/types";

export const bookingServices: BookingService[] = [
  { id: "manicure", name: "Маникюр", durationMinutes: 60, price: 8_000 },
  { id: "pedicure", name: "Педикюр", durationMinutes: 90, price: 12_000 },
  { id: "haircut", name: "Стрижка", durationMinutes: 60, price: 9_000 },
  { id: "coloring", name: "Окрашивание", durationMinutes: 150, price: 25_000 },
];
