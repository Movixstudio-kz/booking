"use client";

import { useState } from "react";
import { appointmentStatuses } from "@/features/appointments/data";
import { useAppointmentsRepository } from "@/features/appointments/hooks";
import { changeAppointmentStatus, removeAppointment } from "@/features/appointments/services";
import type { BookingRecord, BookingStatus } from "@/features/booking/types";
import { canChangeAppointmentStatus, canDeleteAppointments, canViewAppointment } from "@/lib/permissions";

const deniedMessage = "Недостаточно прав для выполнения этого действия.";
const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;
const formatDate = (date: string) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`));

const statusStyles: Record<BookingStatus, string> = {
  new: "bg-[#fff8df] text-[#826816]",
  confirmed: "bg-[#e9f3ff] text-[#3372ad]",
  in_progress: "bg-[#f2edff] text-[#7053a8]",
  completed: "bg-[#e8faef] text-[#237347]",
  cancelled: "bg-[#fff1ef] text-[#a3483e]",
};

export function AppointmentsManager() {
  const { currentUser, context, appointments, setAppointments, repositoryError } = useAppointmentsRepository();
  const [message, setMessage] = useState("");

  const visibleAppointments = appointments
    .filter((appointment) => canViewAppointment(currentUser, appointment))
    .sort((left, right) => `${right.date}${right.time}`.localeCompare(`${left.date}${left.time}`));

  async function updateStatus(appointment: BookingRecord, status: BookingStatus) {
    if (!canChangeAppointmentStatus(currentUser, appointment)) {
      setMessage(deniedMessage);
      return;
    }
    const result = await changeAppointmentStatus(context, appointment.id, status);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setAppointments((current) => current.map((item) => item.id === appointment.id ? result.data : item));
    setMessage("");
  }

  async function deleteAppointment(appointment: BookingRecord) {
    if (!canDeleteAppointments(currentUser)) {
      setMessage(deniedMessage);
      return;
    }
    if (!window.confirm(`Удалить запись клиента «${appointment.clientName}»?`)) return;
    const result = await removeAppointment(context, appointment.id);
    if (result.ok) {
      setAppointments((current) => current.filter((item) => item.id !== appointment.id));
      setMessage("");
    } else {
      setMessage(result.error.message);
    }
  }

  const visibleMessage = message || repositoryError;

  return <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9"><div><p className="text-sm font-medium text-[#619276]">CRM</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Записи</h2><p className="mt-2 text-[#607068]">{currentUser.role === "staff" ? "Ваши записи и актуальные статусы клиентов." : "Все записи, созданные через онлайн-запись и календарь."}</p></div>{visibleMessage && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] p-3 text-sm text-[#9a4036]">{visibleMessage}</p>}<section className="mt-7 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white">{visibleAppointments.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-semibold text-[#385145]">Записей пока нет</p><p className="mt-2 text-sm text-[#7e8e85]">Новые записи появятся здесь автоматически.</p></div> : <><div className={`hidden gap-3 border-b border-[#edf0ea] bg-[#f6f8f4] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7e8e85] xl:grid ${canDeleteAppointments(currentUser) ? "grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr_auto]" : "grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr]"}`}><span>Дата</span><span>Время</span><span>Клиент</span><span>Телефон</span><span>Услуга</span><span>Мастер</span><span>Стоимость</span><span>Статус</span>{canDeleteAppointments(currentUser) && <span />}</div>{visibleAppointments.map((appointment) => { const canChangeStatus = canChangeAppointmentStatus(currentUser, appointment); return <article key={appointment.id} className={`grid gap-3 border-b border-[#edf0ea] px-4 py-5 last:border-b-0 sm:grid-cols-2 xl:items-center ${canDeleteAppointments(currentUser) ? "xl:grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr_auto]" : "xl:grid-cols-[.7fr_.55fr_1fr_1fr_1fr_.9fr_.75fr_1fr]"}`}><p className="text-sm font-semibold text-[#385145]">{formatDate(appointment.date)}</p><p className="text-sm text-[#607068]">{appointment.time}</p><div><p className="text-sm font-semibold text-[#10231d]">{appointment.clientName}</p><p className="mt-1 text-xs text-[#7e8e85] xl:hidden">{appointment.contact}</p></div><p className="hidden text-sm text-[#607068] xl:block">{appointment.contact}</p><p className="text-sm text-[#385145]">{appointment.serviceName}</p><p className="text-sm text-[#607068]">{appointment.staffName}</p><p className="text-sm font-semibold text-[#385145]">{formatPrice(appointment.price)}</p><select aria-label={`Статус записи ${appointment.clientName}`} value={appointment.status} disabled={!canChangeStatus} onChange={(event) => void updateStatus(appointment, event.target.value as BookingStatus)} className={`w-fit rounded-xl border-0 px-2.5 py-2 text-xs font-semibold outline-none ${statusStyles[appointment.status]} ${canChangeStatus ? "cursor-pointer" : "cursor-default opacity-80"}`}>{appointmentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>{canDeleteAppointments(currentUser) && <button type="button" onClick={() => void deleteAppointment(appointment)} className="w-fit rounded-lg px-3 py-2 text-xs font-semibold text-[#a3483e] hover:bg-[#fff1ef]">Удалить</button>}</article>; })}</>}</section></main>;
}
