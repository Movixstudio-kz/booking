"use client";

import { useState } from "react";
import { useHydratedStorageState } from "@/hooks";
import { appointmentStatuses } from "@/features/appointments/data";
import { changeAppointmentStatus, loadAppointments, removeAppointment } from "@/features/appointments/services";
import type { BookingRecord, BookingStatus } from "@/features/booking/types";

const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;
const formatDate = (date: string) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`));

const statusStyles: Record<BookingStatus, string> = {
  new: "bg-[#e9f3ff] text-[#3372ad]",
  confirmed: "bg-[#e8faef] text-[#237347]",
  in_progress: "bg-[#fff2df] text-[#a96921]",
  completed: "bg-[#f2edff] text-[#7053a8]",
  cancelled: "bg-[#fff1ef] text-[#a3483e]",
};

export function AppointmentsManager() {
  const [appointments, setAppointments] = useHydratedStorageState<BookingRecord[]>([], loadAppointments);
  const [message, setMessage] = useState("");

  const sortedAppointments = [...appointments].sort((left, right) => `${right.date}${right.time}`.localeCompare(`${left.date}${left.time}`));

  function updateStatus(id: string, status: BookingStatus) {
    if (!changeAppointmentStatus(id, status)) {
      setMessage("Не удалось изменить статус записи.");
      return;
    }
    setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status } : appointment));
    setMessage("");
  }

  function deleteAppointment(appointment: BookingRecord) {
    if (!window.confirm(`Удалить запись клиента «${appointment.clientName}»?`)) return;
    if (removeAppointment(appointment.id)) setAppointments((current) => current.filter((item) => item.id !== appointment.id));
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9">
      <div><p className="text-sm font-medium text-[#619276]">CRM</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Записи</h2><p className="mt-2 text-[#607068]">Все записи, созданные клиентами через форму онлайн-записи.</p></div>
      {message && <p className="mt-5 rounded-xl bg-[#fff1ef] p-3 text-sm text-[#9a4036]">{message}</p>}
      <section className="mt-7 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white">
        {sortedAppointments.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-semibold text-[#385145]">Записей пока нет</p><p className="mt-2 text-sm text-[#7e8e85]">Новые записи появятся здесь после оформления на странице /booking.</p></div> : <><div className="hidden grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr_auto] gap-3 border-b border-[#edf0ea] bg-[#f6f8f4] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7e8e85] xl:grid"><span>Дата</span><span>Время</span><span>Клиент</span><span>Телефон</span><span>Услуга</span><span>Мастер</span><span>Стоимость</span><span>Статус</span><span /></div>{sortedAppointments.map((appointment) => <article key={appointment.id} className="grid gap-3 border-b border-[#edf0ea] px-4 py-5 last:border-b-0 sm:grid-cols-2 xl:grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr_auto] xl:items-center"><p className="text-sm font-semibold text-[#385145]">{formatDate(appointment.date)}</p><p className="text-sm text-[#607068]">{appointment.time}</p><div><p className="text-sm font-semibold text-[#10231d]">{appointment.clientName}</p><p className="mt-1 text-xs text-[#7e8e85] xl:hidden">{appointment.contact}</p></div><p className="hidden text-sm text-[#607068] xl:block">{appointment.contact}</p><p className="text-sm text-[#385145]">{appointment.serviceName}</p><p className="text-sm text-[#607068]">{appointment.staffName}</p><p className="text-sm font-semibold text-[#385145]">{formatPrice(appointment.price)}</p><select aria-label={`Статус записи ${appointment.clientName}`} value={appointment.status} onChange={(event) => updateStatus(appointment.id, event.target.value as BookingStatus)} className={`w-fit rounded-xl border-0 px-2.5 py-2 text-xs font-semibold outline-none ${statusStyles[appointment.status]}`}>{appointmentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><button type="button" onClick={() => deleteAppointment(appointment)} className="w-fit rounded-lg px-3 py-2 text-xs font-semibold text-[#a3483e] hover:bg-[#fff1ef]">Удалить</button></article>)}</>}
      </section>
    </main>
  );
}
