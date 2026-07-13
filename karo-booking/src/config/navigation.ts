import { routes } from "@/config/routes";

export const siteNavigation = [
  { label: "Для бизнеса", href: "#businesses" },
  { label: "Запись", href: routes.booking },
  { label: "Войти", href: routes.admin },
] as const;

export const adminNavigation = [
  { label: "Dashboard", href: routes.admin, icon: "▦" },
  { label: "Календарь", href: routes.calendar, icon: "□" },
  { label: "Записи", href: routes.appointments, icon: "◷" },
  { label: "Клиенты", href: routes.clients, icon: "♙" },
  { label: "Сотрудники", href: routes.staff, icon: "♧" },
  { label: "Услуги", href: routes.services, icon: "◇" },
] as const;

export const adminSettingsNavigation = { label: "Настройки", href: routes.settings, icon: "⚙" } as const;
