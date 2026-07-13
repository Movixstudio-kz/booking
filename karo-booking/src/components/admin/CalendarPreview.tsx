import Link from "next/link";
import { routes } from "@/config/routes";
import type { BookingRecord } from "@/features/booking/types";

export function CalendarPreview({ appointments }: { appointments: BookingRecord[] }) {
  const formattedDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const sortedAppointments = [...appointments].sort((left, right) => left.time.localeCompare(right.time));

  return <section className="rounded-2xl border border-[#dfe5da] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ea] px-5 py-4 sm:px-6"><div><h2 className="font-semibold tracking-[-0.03em] text-[#10231d]">Расписание на сегодня</h2><p className="mt-1 text-sm capitalize text-[#718178]">{formattedDate}</p></div><Link href={routes.appointments} className="rounded-xl border border-[#d5ddd5] px-3 py-2 text-sm font-semibold text-[#365146] transition hover:bg-[#f3f6f1]">Открыть записи</Link></div><div className="p-4 sm:p-6">{sortedAppointments.length === 0 ? <div className="rounded-2xl bg-[#f5f7f2] px-5 py-10 text-center"><p className="font-semibold text-[#385145]">На сегодня записей нет</p><p className="mt-2 text-sm text-[#7e8e85]">Новые записи из онлайн-формы появятся здесь автоматически.</p></div> : <div className="space-y-2">{sortedAppointments.map((appointment) => <div key={appointment.id} className="grid gap-2 rounded-xl border border-[#edf0ea] px-4 py-3 sm:grid-cols-[70px_1fr_1fr_auto] sm:items-center"><span className="text-sm font-semibold text-[#237347]">{appointment.time}</span><span className="text-sm font-semibold text-[#10231d]">{appointment.clientName}</span><span className="text-sm text-[#607068]">{appointment.serviceName} · {appointment.staffName}</span><span className="text-xs text-[#7e8e85]">{appointment.contact}</span></div>)}</div>}</div></section>;
}
