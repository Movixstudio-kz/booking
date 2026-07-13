"use client";

import { useState, type FormEvent } from "react";
import { useHydratedStorageState } from "@/hooks";
import { defaultServices } from "@/features/services/data";
import { loadServices, saveServices } from "@/features/services/services";
import type { ServiceItem } from "@/features/services/types";
import { removeServiceFromStaff } from "@/features/staff/services";

const emptyService: ServiceItem = { id: "", name: "", price: 0, durationMinutes: 60, isActive: true, description: "" };
const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `service-${Date.now()}`;
}

export function ServicesManager() {
  const [services, setServices] = useHydratedStorageState<ServiceItem[]>(defaultServices, loadServices);
  const [form, setForm] = useState<ServiceItem>(emptyService);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");

  function openCreateForm() {
    setForm(emptyService);
    setMessage("");
    setIsFormOpen(true);
  }

  function openEditForm(service: ServiceItem) {
    setForm({ ...service });
    setMessage("");
    setIsFormOpen(true);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2 || form.price < 0 || form.durationMinutes < 5) {
      setMessage("Проверьте название, стоимость и длительность услуги.");
      return;
    }
    const record = { ...form, id: form.id || createId(), name: form.name.trim(), description: form.description.trim() };
    const nextServices = form.id ? services.map((service) => service.id === form.id ? record : service) : [...services, record];
    if (!saveServices(nextServices)) {
      setMessage("Не удалось сохранить услугу в браузере.");
      return;
    }
    setServices(nextServices);
    setIsFormOpen(false);
    setMessage("");
  }

  function deleteService(service: ServiceItem) {
    if (!window.confirm(`Удалить услугу «${service.name}»? Она будет убрана из профилей сотрудников.`)) return;
    const nextServices = services.filter((item) => item.id !== service.id);
    if (saveServices(nextServices)) {
      removeServiceFromStaff(service.id);
      setServices(nextServices);
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#619276]">Каталог</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Услуги</h2><p className="mt-2 text-[#607068]">Настройте стоимость, длительность и доступность услуг.</p></div><button type="button" onClick={openCreateForm} className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">+ Добавить услугу</button></div>

      {isFormOpen && <form onSubmit={submitForm} className="mt-7 rounded-2xl border border-[#dfe5da] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10231d]">{form.id ? "Редактирование услуги" : "Новая услуга"}</h3><button type="button" onClick={() => setIsFormOpen(false)} className="text-sm font-semibold text-[#718178]">Закрыть</button></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm font-semibold text-[#385145] md:col-span-3">Название<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Стоимость, ₸<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="text-sm font-semibold text-[#385145]">Длительность, мин<input type="number" min="5" step="5" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label><label className="flex items-center gap-3 pt-8 text-sm font-semibold text-[#385145]"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-[#237347]" />Услуга активна</label><label className="text-sm font-semibold text-[#385145] md:col-span-3">Описание<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-[#d5ddd5] px-3 py-3 font-normal outline-none focus:border-[#47b875]" /></label></div>{message && <p className="mt-4 text-sm text-[#9a4036]">{message}</p>}<div className="mt-6 flex justify-end"><button type="submit" className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white">Сохранить</button></div></form>}

      <section className="mt-7 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white"><div className="hidden grid-cols-[1.5fr_.7fr_.7fr_.7fr_auto] gap-4 border-b border-[#edf0ea] bg-[#f6f8f4] px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#7e8e85] md:grid"><span>Услуга</span><span>Стоимость</span><span>Длительность</span><span>Статус</span><span>Действия</span></div>{services.map((service) => <article key={service.id} className="grid gap-4 border-b border-[#edf0ea] px-5 py-5 last:border-b-0 md:grid-cols-[1.5fr_.7fr_.7fr_.7fr_auto] md:items-center"><div><h3 className="font-semibold text-[#10231d]">{service.name}</h3><p className="mt-1 text-xs leading-5 text-[#718178]">{service.description || "Описание не добавлено"}</p></div><p className="text-sm font-semibold text-[#385145]">{formatPrice(service.price)}</p><p className="text-sm text-[#607068]">{service.durationMinutes} минут</p><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${service.isActive ? "bg-[#e8faef] text-[#237347]" : "bg-[#f0f1ef] text-[#7e8982]"}`}>{service.isActive ? "Активна" : "Неактивна"}</span><div className="flex gap-1"><button type="button" onClick={() => openEditForm(service)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#365146] hover:bg-[#f3f6f1]">Изменить</button><button type="button" onClick={() => deleteService(service)} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#a3483e] hover:bg-[#fff1ef]">Удалить</button></div></article>)}</section>
    </main>
  );
}
