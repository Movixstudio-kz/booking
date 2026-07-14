"use client";

import Link from "next/link";
import { CalendarPreview } from "@/components/admin/CalendarPreview";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { routes } from "@/config/routes";
import { useDashboardData } from "@/features/dashboard/hooks";
import { canCreateAppointment } from "@/lib/permissions";

export function DashboardScreen() {
  const { currentUser, appointments, activeStaff, activeServices, todayAppointments, freeSlots } = useDashboardData();
  const metrics = [
    { label: "Количество записей", value: String(appointments.length), change: "Всего в CRM", tone: "green" as const },
    { label: "Количество сотрудников", value: String(activeStaff.length), change: "Активных", tone: "blue" as const },
    { label: "Количество услуг", value: String(activeServices.length), change: "Активных", tone: "purple" as const },
    { label: "Сегодняшние записи", value: String(todayAppointments.length), change: "Без отменённых", tone: "orange" as const },
    { label: "Свободные окна", value: String(freeSlots), change: "До конца дня", tone: "green" as const },
  ];

  return <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#619276]">Обзор бизнеса</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Добрый день, {currentUser.name}!</h2><p className="mt-2 text-[#607068]">Вот что происходит в вашем салоне сегодня.</p></div>{canCreateAppointment(currentUser) && <Link href={routes.booking} className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">+ Новая запись</Link>}</div><section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <DashboardCard key={metric.label} {...metric} />)}</section><div className="mt-7"><CalendarPreview appointments={todayAppointments} /></div></main>;
}
