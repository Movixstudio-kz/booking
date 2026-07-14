"use client";

import { useMemo, useState, type FormEvent } from "react";
import { appointmentStatuses } from "@/features/appointments/data";
import type { BookingRecord, BookingStatus, CreateBookingResult } from "@/features/booking/types";
import type { CalendarDialogMode } from "@/features/calendar/types";
import { CALENDAR_END_MINUTES, calendarStatusStyles, getEndTime, getHalfHourSlots, timeToMinutes, toDateKey } from "@/features/calendar/utils";
import type { ServiceItem } from "@/features/services/types";
import type { StaffItem } from "@/features/staff/types";

type AppointmentDialogProps = {
  mode: CalendarDialogMode;
  appointment: BookingRecord | null;
  defaultDate: string;
  staff: StaffItem[];
  services: ServiceItem[];
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (appointment: BookingRecord, status: BookingStatus) => boolean;
  onSave: (appointment: BookingRecord, isEditing: boolean) => CreateBookingResult;
};

type AppointmentForm = {
  clientName: string;
  contact: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: BookingStatus;
  comment: string;
};

const deniedMessage = "Недостаточно прав для выполнения этого действия.";
const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `appointment-${Date.now()}`;
}

export function AppointmentDialog({ mode, appointment, defaultDate, staff, services, canEdit, canDelete, canChangeStatus, onClose, onEdit, onDelete, onStatusChange, onSave }: AppointmentDialogProps) {
  const firstService = appointment?.serviceId ?? services[0]?.id ?? "";
  const initialStaff = appointment?.staffId ?? staff.find((member) => member.serviceIds.includes(firstService))?.id ?? "";
  const [form, setForm] = useState<AppointmentForm>(() => ({
    clientName: appointment?.clientName ?? "",
    contact: appointment?.contact ?? "",
    serviceId: firstService,
    staffId: initialStaff,
    date: appointment?.date ?? defaultDate,
    time: appointment?.time ?? "09:00",
    status: appointment?.status ?? "new",
    comment: appointment?.comment ?? "",
  }));
  const [error, setError] = useState("");
  const selectedService = services.find((service) => service.id === form.serviceId);
  const availableStaff = useMemo(() => staff.filter((member) => member.serviceIds.includes(form.serviceId)), [form.serviceId, staff]);

  function changeService(serviceId: string) {
    const matchingStaff = staff.filter((member) => member.serviceIds.includes(serviceId));
    setForm((current) => ({ ...current, serviceId, staffId: matchingStaff.some((member) => member.id === current.staffId) ? current.staffId : (matchingStaff[0]?.id ?? "") }));
    setError("");
  }

  function changeStatus(status: BookingStatus) {
    if (!appointment || !canChangeStatus || !onStatusChange(appointment, status)) {
      setError(deniedMessage);
      return;
    }
    setForm((current) => ({ ...current, status }));
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const selectedStaff = staff.find((member) => member.id === form.staffId);
    if (!form.clientName.trim() || !form.contact.trim() || !selectedService || !selectedStaff || !form.date || !form.time) {
      setError("Заполните все обязательные поля.");
      return;
    }
    if (mode === "create" && form.date < toDateKey(new Date())) {
      setError("Нельзя создать запись на прошедшую дату.");
      return;
    }
    if (timeToMinutes(form.time) + selectedService.durationMinutes > CALENDAR_END_MINUTES) {
      setError("Запись должна завершиться до 20:00.");
      return;
    }
    const record: BookingRecord = {
      id: appointment?.id ?? createId(),
      clientName: form.clientName.trim(),
      contact: form.contact.trim(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date: form.date,
      time: form.time,
      price: selectedService.price,
      durationMinutes: selectedService.durationMinutes,
      status: form.status,
      comment: form.comment.trim(),
      createdAt: appointment?.createdAt ?? new Date().toISOString(),
    };
    const result = onSave(record, mode === "edit");
    if (!result.ok) {
      const messages = {
        slot_taken: "У сотрудника уже есть запись на это время",
        schedule_unavailable: "Выбранное время недоступно по графику сотрудника.",
        permission_denied: deniedMessage,
        storage_error: "Не удалось сохранить запись. Попробуйте ещё раз.",
      };
      setError(messages[result.reason]);
      return;
    }
    onClose();
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10231d]/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e3e8df] bg-white px-5 py-4 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a9990]">KARO Booking</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#10231d]">{mode === "view" ? "Карточка записи" : mode === "edit" ? "Редактировать запись" : "Создать запись"}</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-[#f1f4ef] text-xl text-[#53665d] hover:bg-[#e7ece4]" aria-label="Закрыть">×</button></div>{mode === "view" && appointment ? <div className="space-y-6 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-2xl font-semibold text-[#10231d]">{appointment.clientName}</h3><p className="mt-1 text-sm text-[#718178]">{appointment.contact}</p></div>{canChangeStatus ? <select value={form.status} onChange={(event) => changeStatus(event.target.value as BookingStatus)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${calendarStatusStyles[form.status]}`}>{appointmentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select> : <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${calendarStatusStyles[appointment.status]}`}>{appointmentStatuses.find((status) => status.value === appointment.status)?.label}</span>}</div><dl className="grid gap-4 rounded-2xl bg-[#f6f8f4] p-5 sm:grid-cols-2"><div><dt className="text-xs text-[#8a9990]">Услуга</dt><dd className="mt-1 font-semibold text-[#2d473c]">{appointment.serviceName}</dd></div><div><dt className="text-xs text-[#8a9990]">Стоимость</dt><dd className="mt-1 font-semibold text-[#2d473c]">{formatPrice(appointment.price)}</dd></div><div><dt className="text-xs text-[#8a9990]">Сотрудник</dt><dd className="mt-1 font-semibold text-[#2d473c]">{appointment.staffName}</dd></div><div><dt className="text-xs text-[#8a9990]">Дата и время</dt><dd className="mt-1 font-semibold text-[#2d473c]">{new Date(`${appointment.date}T00:00:00`).toLocaleDateString("ru-RU")} · {appointment.time}–{getEndTime(appointment.time, appointment.durationMinutes)}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-[#8a9990]">Комментарий</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-[#2d473c]">{appointment.comment || "Комментарий не добавлен"}</dd></div></dl>{error && <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#a53c35]">{error}</p>}{(canEdit || canDelete) && <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{canDelete && <button type="button" onClick={() => { if (window.confirm("Удалить эту запись?")) onDelete(appointment.id); }} className="rounded-xl border border-[#e8b8b4] px-5 py-3 text-sm font-semibold text-[#a53c35] hover:bg-[#fff2f0]">Удалить</button>}{canEdit && <button type="button" onClick={onEdit} className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#244137]">Редактировать</button>}</div>}</div> : <form onSubmit={submit} className="space-y-5 p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-[#385145]">Имя клиента<input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} className="w-full rounded-xl border border-[#d7dfd5] px-4 py-3 outline-none focus:border-[#628b78]" placeholder="Анна" /></label><label className="space-y-2 text-sm font-medium text-[#385145]">Телефон или WhatsApp<input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className="w-full rounded-xl border border-[#d7dfd5] px-4 py-3 outline-none focus:border-[#628b78]" placeholder="+7 700 000 00 00" /></label><label className="space-y-2 text-sm font-medium text-[#385145]">Услуга<select value={form.serviceId} onChange={(event) => changeService(event.target.value)} className="w-full rounded-xl border border-[#d7dfd5] bg-white px-4 py-3 outline-none focus:border-[#628b78]">{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.durationMinutes} мин · {formatPrice(service.price)}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-[#385145]">Сотрудник<select value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })} className="w-full rounded-xl border border-[#d7dfd5] bg-white px-4 py-3 outline-none focus:border-[#628b78]">{availableStaff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-[#385145]">Дата<input type="date" value={form.date} min={mode === "create" ? toDateKey(new Date()) : undefined} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full rounded-xl border border-[#d7dfd5] px-4 py-3 outline-none focus:border-[#628b78]" /></label><label className="space-y-2 text-sm font-medium text-[#385145]">Время<select value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="w-full rounded-xl border border-[#d7dfd5] bg-white px-4 py-3 outline-none focus:border-[#628b78]">{getHalfHourSlots().map((time) => <option key={time} value={time}>{time}{selectedService ? `–${getEndTime(time, selectedService.durationMinutes)}` : ""}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-[#385145] sm:col-span-2">Статус<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })} className="w-full rounded-xl border border-[#d7dfd5] bg-white px-4 py-3 outline-none focus:border-[#628b78]">{appointmentStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-[#385145] sm:col-span-2">Комментарий<textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} rows={3} className="w-full resize-none rounded-xl border border-[#d7dfd5] px-4 py-3 outline-none focus:border-[#628b78]" placeholder="Пожелания клиента или заметка администратора" /></label></div>{availableStaff.length === 0 && <p className="rounded-xl bg-[#fff8df] px-4 py-3 text-sm text-[#826816]">Для выбранной услуги нет активных сотрудников.</p>}{error && <p role="alert" className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#a53c35]">{error}</p>}<div className="flex flex-col-reverse gap-3 border-t border-[#e3e8df] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-[#d7dfd5] px-5 py-3 text-sm font-semibold text-[#53665d] hover:bg-[#f3f6f1]">Отмена</button><button type="submit" disabled={!selectedService || availableStaff.length === 0} className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#244137] disabled:cursor-not-allowed disabled:opacity-40">Сохранить запись</button></div></form>}</div></div>;
}
