"use client";

import { useState, type FormEvent } from "react";
import { ScheduleEditor } from "@/features/schedule";
import { defaultServices } from "@/features/services/data";
import { loadServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import { loadStaff, saveStaff } from "@/features/staff/services";
import type { StaffItem } from "@/features/staff/types";
import { useCurrentUser, useHydratedStorageState } from "@/hooks";
import { canEditStaffSchedule, canManageStaff, canViewStaffSchedule } from "@/lib/permissions";

const deniedMessage = "Недостаточно прав для выполнения этого действия.";
const emptyStaff: StaffItem = { id: "", name: "", position: "", phone: "", calendarColor: "#3ee58c", isActive: true, serviceIds: [] };

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `staff-${Date.now()}`;
}

export function StaffManager() {
  const { currentUser } = useCurrentUser();
  const [staff, setStaff] = useHydratedStorageState<StaffItem[]>(defaultStaff, loadStaff);
  const [services] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);
  const [form, setForm] = useState<StaffItem>(emptyStaff);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = canManageStaff(currentUser);
  const scheduleStaff = staff.filter((member) => canViewStaffSchedule(currentUser, member.id));

  function denyUnlessAllowed(): boolean {
    if (canManageStaff(currentUser)) return false;
    setMessage(deniedMessage);
    setIsFormOpen(false);
    return true;
  }

  function openCreateForm() {
    if (denyUnlessAllowed()) return;
    setForm(emptyStaff);
    setMessage("");
    setIsFormOpen(true);
  }

  function openEditForm(member: StaffItem) {
    if (denyUnlessAllowed()) return;
    setForm({ ...member, serviceIds: [...member.serviceIds] });
    setMessage("");
    setIsFormOpen(true);
  }

  function toggleService(serviceId: string) {
    if (denyUnlessAllowed()) return;
    setForm((current) => ({ ...current, serviceIds: current.serviceIds.includes(serviceId) ? current.serviceIds.filter((id) => id !== serviceId) : [...current.serviceIds, serviceId] }));
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (denyUnlessAllowed()) return;
    if (form.name.trim().length < 2 || !form.position.trim() || form.phone.replace(/\D/g, "").length < 7) {
      setMessage("Заполните имя, должность и корректный телефон сотрудника.");
      return;
    }
    const record = { ...form, id: form.id || createId(), name: form.name.trim(), position: form.position.trim(), phone: form.phone.trim() };
    const nextStaff = form.id ? staff.map((member) => member.id === form.id ? record : member) : [...staff, record];
    if (!saveStaff(nextStaff)) {
      setMessage("Не удалось сохранить сотрудника в браузере.");
      return;
    }
    setStaff(nextStaff);
    setIsFormOpen(false);
    setMessage("");
  }

  function deleteMember(member: StaffItem) {
    if (denyUnlessAllowed()) return;
    if (!window.confirm(`Удалить сотрудника «${member.name}»? Созданные записи сохранятся.`)) return;
    const nextStaff = staff.filter((item) => item.id !== member.id);
    if (saveStaff(nextStaff)) {
      setStaff(nextStaff);
      setMessage("");
    }
  }

  return <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#619276]">Команда</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Сотрудники</h2><p className="mt-2 text-[#607068]">Управляйте специалистами, услугами и рабочим расписанием.</p></div>{canManage && <button type="button" onClick={openCreateForm} className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">+ Добавить сотрудника</button>}</div>{message && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] p-3 text-sm text-[#9a4036]">{message}</p>}{canManage && isFormOpen && <form onSubmit={submitForm} className="mt-7 rounded-2xl border border-[#dfe5da] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10231d]">{form.id ? "Редактирование сотрудника" : "Новый сотрудник"}</h3><button type="button" onClick={() => setIsFormOpen(false)} className="text-sm font-semibold text-[#718178]">Закрыть</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-[#385145]">Имя<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Должность<input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Телефон<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Цвет календаря<span className="mt-2 flex h-[50px] items-center gap-3 rounded-xl border border-[#d5ddd5] px-3"><input type="color" value={form.calendarColor} onChange={(event) => setForm({ ...form, calendarColor: event.target.value })} className="size-8 cursor-pointer border-0 bg-transparent" /><span className="font-mono text-xs font-normal text-[#718178]">{form.calendarColor}</span></span></label></div><fieldset className="mt-5"><legend className="text-sm font-semibold text-[#385145]">Оказываемые услуги</legend><div className="mt-3 flex flex-wrap gap-2">{services.map((service) => <label key={service.id} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition ${form.serviceIds.includes(service.id) ? "border-[#47b875] bg-[#e8faef] text-[#237347]" : "border-[#d5ddd5] text-[#607068]"}`}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} className="sr-only" />{service.name}</label>)}</div></fieldset><label className="mt-5 flex items-center gap-3 text-sm font-semibold text-[#385145]"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-[#237347]" />Сотрудник активен</label><div className="mt-6 flex justify-end"><button type="submit" className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white">Сохранить</button></div></form>}<section className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{staff.map((member) => <article key={member.id} className="rounded-2xl border border-[#dfe5da] bg-white p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl font-bold text-[#10231d]" style={{ backgroundColor: member.calendarColor }}>{member.name.slice(0, 1)}</span><div><h3 className="font-semibold text-[#10231d]">{member.name}</h3><p className="mt-1 text-xs text-[#718178]">{member.position}</p></div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.isActive ? "bg-[#e8faef] text-[#237347]" : "bg-[#f0f1ef] text-[#7e8982]"}`}>{member.isActive ? "Активен" : "Неактивен"}</span></div><p className="mt-5 text-sm text-[#607068]">{member.phone}</p><div className="mt-4 flex min-h-7 flex-wrap gap-1.5">{member.serviceIds.map((id) => { const service = services.find((item) => item.id === id); return service ? <span key={id} className="rounded-lg bg-[#f1f5ef] px-2 py-1 text-xs text-[#4e675a]">{service.name}</span> : null; })}</div>{canManage && <div className="mt-5 flex gap-2 border-t border-[#edf0ea] pt-4"><button type="button" onClick={() => openEditForm(member)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#365146] hover:bg-[#f3f6f1]">Изменить</button><button type="button" onClick={() => deleteMember(member)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#a3483e] hover:bg-[#fff1ef]">Удалить</button></div>}</article>)}</section><ScheduleEditor staff={scheduleStaff} lockedStaffId={currentUser.role === "staff" ? currentUser.staffId : undefined} canEditStaffSchedule={(staffId) => canEditStaffSchedule(currentUser, staffId)} onPermissionDenied={setMessage} /></main>;
}
