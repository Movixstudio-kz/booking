import type { StaffItem } from "@/features/staff/types";

export const defaultStaff: StaffItem[] = [
  { id: "aigerim", name: "Айгерим", position: "Мастер ногтевого сервиса", phone: "+7 700 111 11 11", calendarColor: "#3ee58c", isActive: true, serviceIds: ["manicure", "pedicure"] },
  { id: "dana", name: "Дана", position: "Парикмахер-колорист", phone: "+7 700 222 22 22", calendarColor: "#7aa7ff", isActive: true, serviceIds: ["haircut", "coloring"] },
  { id: "aliya", name: "Алия", position: "Универсальный мастер", phone: "+7 700 333 33 33", calendarColor: "#b493f5", isActive: true, serviceIds: ["manicure", "pedicure", "haircut"] },
];
