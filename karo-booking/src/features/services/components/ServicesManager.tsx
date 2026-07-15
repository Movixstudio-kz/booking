"use client";

import { useState, type FormEvent } from "react";
import { useServicesRepository } from "@/features/services/hooks";
import { useCurrentUser } from "@/hooks";
import { canManageServices } from "@/lib/permissions";
import type { ServiceItem } from "@/features/services/types";

const deniedMessage = "Недостаточно прав для выполнения этого действия.";
const emptyService: ServiceItem = { id: "", name: "", price: 0, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, isActive: true, onlineBookingEnabled: true, description: "" };
const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

export function ServicesManager() {
  const { currentUser } = useCurrentUser();
  const { services, error: repositoryError, createService, updateService, archiveService } = useServicesRepository(currentUser);
  const [form, setForm] = useState<ServiceItem>(emptyService);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = canManageServices(currentUser);
  const displayedMessage = message || repositoryError;

  function denyUnlessAllowed(): boolean {
    if (canManageServices(currentUser)) return false;
    setMessage(deniedMessage);
    setIsFormOpen(false);
    return true;
  }

  function openCreateForm() {
    if (denyUnlessAllowed()) return;
    setForm(emptyService);
    setMessage("");
    setIsFormOpen(true);
  }

  function openEditForm(service: ServiceItem) {
    if (denyUnlessAllowed()) return;
    setForm({ ...service });
    setMessage("");
    setIsFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (denyUnlessAllowed()) return;
    if (form.name.trim().length < 2 || form.price < 0 || form.durationMinutes < 5) {
      setMessage("Проверьте название, стоимость и длительность услуги.");
      return;
    }
    const record = { ...form, name: form.name.trim(), description: form.description.trim() };
    const { id, ...input } = record;
    const result = id ? await updateService(id, input) : await createService(input);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setIsFormOpen(false);
    setMessage("");
  }

  async function deleteService(service: ServiceItem) {
    if (denyUnlessAllowed()) return;
    if (!window.confirm(`Удалить услугу «${service.name}»? Она станет неактивной и исчезнет из онлайн-записи.`)) return;
    const result = await archiveService(service.id);
    if (result.ok) {
      setMessage("");
    } else {
      setMessage(result.error.message);
    }
  }

  return <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#619276]">Каталог</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Услуги</h2><p className="mt-2 text-[#607068]">Настройте стоимость, длительность и доступность услуг.</p></div>{canManage && <button type="button" onClick={openCreateForm} className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">+ Добавить услугу</button>}</div>{displayedMessage && <p role="alert" className="mt-5 rounded-xl bg-[#fff1ef] p-3 text-sm text-[#9a4036]">{displayedMessage}</p>}{canManage && isFormOpen && <form onSubmit={submitForm} className="mt-7 rounded-2xl border border-[#dfe5da] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10231d]">{form.id ? "Редактирование услуги" : "Новая услуга"}</h3><button type="button" onClick={() => setIsFormOpen(false)} className="text-sm font-semibold text-[#718178]">Закрыть</button></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm font-semibold text-[#385145] md:col-span-3">Название<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Стоимость, ₸<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Длительность, мин<input type="number" min="5" step="5" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="flex items-center gap-3 pt-8 text-sm font-semibold text-[#385145]"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-[#237347]" />Услуга активна</label><label className="text-sm font-semibold text-[#385145] md:col-span-3">Описание<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label></div><div className="mt-6 flex justify-end"><button type="submit" className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white">Сохранить</button></div></form>}<section className="mt-7 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white"><div className={`hidden gap-4 border-b border-[#edf0ea] bg-[#f6f8f4] px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#7e8e85] md:grid ${canManage ? "grid-cols-[1.5fr_.7fr_.7fr_.7fr_auto]" : "grid-cols-[1.5fr_.7fr_.7fr_.7fr]"}`}><span>Услуга</span><span>Стоимость</span><span>Длительность</span><span>Статус</span>{canManage && <span>Действия</span>}</div>{services.map((service) => <article key={service.id} className={`grid gap-4 border-b border-[#edf0ea] px-5 py-5 last:border-b-0 md:items-center ${canManage ? "md:grid-cols-[1.5fr_.7fr_.7fr_.7fr_auto]" : "md:grid-cols-[1.5fr_.7fr_.7fr_.7fr]"}`}><div><h3 className="font-semibold text-[#10231d]">{service.name}</h3><p className="mt-1 text-xs leading-5 text-[#718178]">{service.description || "Описание не добавлено"}</p></div><p className="text-sm font-semibold text-[#385145]">{formatPrice(service.price)}</p><p className="text-sm text-[#607068]">{service.durationMinutes} минут</p><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${service.isActive ? "bg-[#e8faef] text-[#237347]" : "bg-[#f0f1ef] text-[#7e8982]"}`}>{service.isActive ? "Активна" : "Неактивна"}</span>{canManage && <div className="flex gap-1"><button type="button" onClick={() => openEditForm(service)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#365146] hover:bg-[#f3f6f1]">Изменить</button><button type="button" onClick={() => deleteService(service)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#a3483e] hover:bg-[#fff1ef]">Удалить</button></div>}</article>)}</section></main>;
}
