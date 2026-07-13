import type { ServiceItem } from "@/features/services/types";

export const defaultServices: ServiceItem[] = [
  { id: "manicure", name: "Маникюр", price: 8_000, durationMinutes: 60, isActive: true, description: "Классический маникюр и покрытие." },
  { id: "pedicure", name: "Педикюр", price: 12_000, durationMinutes: 90, isActive: true, description: "Комплексный уход за стопами и ногтями." },
  { id: "haircut", name: "Стрижка", price: 9_000, durationMinutes: 60, isActive: true, description: "Женская или мужская стрижка с укладкой." },
  { id: "coloring", name: "Окрашивание", price: 25_000, durationMinutes: 150, isActive: true, description: "Окрашивание волос и консультация колориста." },
];
