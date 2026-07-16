"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/config/routes";
import { timeSlots } from "@/features/booking/data";
import {
  createBooking,
  loadPublicAvailableSlots,
  loadPublicServices,
  loadPublicStaff,
  subscribeToPublicBookingData,
} from "@/features/booking/services";
import type { BookingRecord, ServiceId } from "@/features/booking/types";
import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import type { PublicStaffItem } from "@/features/staff/types";
import { BookingConfirmation } from "./BookingConfirmation";
import { BookingProgress } from "./BookingProgress";
import { BookingSummary } from "./BookingSummary";

const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function getToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function isPastTime(date: string, time: string): boolean {
  if (!date) return false;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime() <= Date.now();
}

function createRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function BookingFlow() {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<ServiceId | "">("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [contact, setContact] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([...timeSlots]);
  const [catalogServices, setCatalogServices] = useState<ServiceItem[]>(defaultServices);
  const [catalogStaff, setCatalogStaff] = useState<PublicStaffItem[]>(defaultStaff);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  const activeCatalogServices = catalogServices.filter((service) => service.isActive);
  const activeCatalogStaff = catalogStaff.filter((member) => member.isActive);
  const selectedService = activeCatalogServices.find((service) => service.id === serviceId);
  const selectedServiceDuration = selectedService?.durationMinutes;
  const selectedBufferBefore = selectedService?.bufferBeforeMinutes ?? 0;
  const selectedBufferAfter = selectedService?.bufferAfterMinutes ?? 0;
  const selectedStaff = activeCatalogStaff.find((member) => member.id === staffId);
  const availableStaff = activeCatalogStaff.filter((member) => serviceId && member.serviceIds.includes(serviceId));

  const availableSlotCount = date ? availableSlots.length : timeSlots.length;

  const refreshRepositoryData = useCallback(async () => {
    const [servicesResult, staffResult] = await Promise.all([
      loadPublicServices(),
      loadPublicStaff(),
    ]);
    if (servicesResult.ok) setCatalogServices(servicesResult.data);
    if (staffResult.ok) setCatalogStaff(staffResult.data);

    if (!servicesResult.ok) setError(servicesResult.error.message);
    else if (!staffResult.ok) setError(staffResult.error.message);
  }, []);

  async function refreshAvailableSlots() {
    if (!staffId || !date || !selectedServiceDuration) {
      setAvailableSlots([...timeSlots]);
      return;
    }
    const result = await loadPublicAvailableSlots({
      staffId,
      date,
      slots: timeSlots,
      durationMinutes: selectedServiceDuration,
      bufferBeforeMinutes: selectedBufferBefore,
      bufferAfterMinutes: selectedBufferAfter,
    });
    if (result.ok) {
      setAvailableSlots(result.data);
    } else {
      setAvailableSlots([]);
      setError(result.error.message);
    }
  }

  useEffect(() => {
    let isActive = true;
    const refresh = () => {
      void refreshRepositoryData();
      void (async () => {
        if (!staffId || !date || !selectedServiceDuration) {
          if (isActive) setAvailableSlots([...timeSlots]);
          return;
        }
        const result = await loadPublicAvailableSlots({
          staffId,
          date,
          slots: timeSlots,
          durationMinutes: selectedServiceDuration,
          bufferBeforeMinutes: selectedBufferBefore,
          bufferAfterMinutes: selectedBufferAfter,
        });
        if (!isActive) return;
        if (result.ok) setAvailableSlots(result.data);
        else {
          setAvailableSlots([]);
          setError(result.error.message);
        }
      })();
    };
    const frameId = window.requestAnimationFrame(refresh);
    const unsubscribe = subscribeToPublicBookingData(refresh);
    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
      unsubscribe();
    };
  }, [date, refreshRepositoryData, selectedBufferAfter, selectedBufferBefore, selectedServiceDuration, staffId]);

  function selectService(id: ServiceId) {
    setServiceId(id);
    setStaffId("");
    setDate("");
    setTime("");
    setError("");
  }

  function selectStaff(id: string) {
    setStaffId(id);
    setDate("");
    setTime("");
    setError("");
  }

  function selectDate(nextDate: string) {
    if (nextDate && nextDate < getToday()) {
      setDate("");
      setTime("");
      setError("Нельзя выбрать прошедшую дату.");
      return;
    }

    setDate(nextDate);
    setTime("");
    setAvailableSlots([]);
    setError("");
  }

  function goNext() {
    setError("");
    setStep((currentStep) => Math.min(4, currentStep + 1));
  }

  function goBack() {
    setError("");
    setStep((currentStep) => Math.max(1, currentStep - 1));
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedService || !selectedStaff || !date || !time) {
      setError("Вернитесь назад и заполните все параметры записи.");
      return;
    }

    if (date < getToday() || isPastTime(date, time)) {
      setTime("");
      setStep(3);
      setError("Выбранное время уже прошло. Пожалуйста, выберите другой слот.");
      return;
    }

    const latestSlots = await loadPublicAvailableSlots({
      staffId: selectedStaff.id,
      date,
      slots: [time],
      durationMinutes: selectedService.durationMinutes,
      bufferBeforeMinutes: selectedService.bufferBeforeMinutes,
      bufferAfterMinutes: selectedService.bufferAfterMinutes,
    });
    if (!latestSlots.ok) {
      setError(latestSlots.error.message);
      return;
    }
    if (!latestSlots.data.includes(time)) {
      setAvailableSlots((current) => current.filter((slot) => slot !== time));
      setTime("");
      setStep(3);
      setError("У сотрудника уже есть запись на это время.");
      return;
    }

    if (clientName.trim().length < 2) {
      setError("Укажите имя клиента — минимум 2 символа.");
      return;
    }

    if (contact.replace(/\D/g, "").length < 7) {
      setError("Укажите корректный номер телефона или WhatsApp.");
      return;
    }

    const booking: BookingRecord = {
      id: createRecordId(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date,
      time,
      clientName: clientName.trim(),
      contact: contact.trim(),
      price: selectedService.price,
      durationMinutes: selectedService.durationMinutes,
      bufferBeforeMinutes: selectedService.bufferBeforeMinutes,
      bufferAfterMinutes: selectedService.bufferAfterMinutes,
      comment: "",
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const result = await createBooking(booking);
    if (!result.ok) {
      if (result.reason === "slot_taken") {
        await refreshAvailableSlots();
        setTime("");
        setStep(3);
        setError("У сотрудника уже есть запись на это время.");
      } else if (result.reason === "schedule_unavailable") {
        await refreshAvailableSlots();
        setTime("");
        setStep(3);
        setError("Выбранное время недоступно по графику сотрудника. Выберите другой слот.");
      } else {
        setError("Не удалось сохранить запись на устройстве. Проверьте настройки браузера и попробуйте снова.");
      }
      return;
    }

    setConfirmedBooking(booking);
  }

  function resetFlow() {
    setStep(1);
    setServiceId("");
    setStaffId("");
    setDate("");
    setTime("");
    setClientName("");
    setContact("");
    setAvailableSlots([...timeSlots]);
    setError("");
    setConfirmedBooking(null);
  }

  if (confirmedBooking) {
    return <main className="min-h-screen bg-[#f6f8f1] px-5 py-8 sm:py-14"><BookingConfirmation booking={confirmedBooking} onCreateAnother={resetFlow} formatDate={formatDate} formatPrice={formatPrice} /></main>;
  }

  return (
    <main className="min-h-screen bg-[#f6f8f1]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Logo /><Link href={routes.home} className="text-sm font-semibold text-[#607068] transition hover:text-[#10231d]">Вернуться на главную</Link></header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-5 sm:px-8 sm:pt-10">
        <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">Онлайн-запись</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#10231d] sm:text-5xl">Выберите удобное время</h1><p className="mt-4 text-[#607068]">Запись займёт не больше пары минут. Начните с выбора услуги.</p></div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="rounded-[28px] border border-[#dfe5da] bg-white p-5 shadow-xl shadow-[#315343]/5 sm:p-8">
            <BookingProgress currentStep={step} />

            <div className="mt-9">
              {step === 1 && <div><h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#10231d]">Выберите услугу</h2><p className="mt-2 text-sm text-[#718178]">Стоимость и длительность указаны заранее.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{activeCatalogServices.map((service) => <button type="button" key={service.id} onClick={() => selectService(service.id)} aria-pressed={service.id === serviceId} className={`rounded-2xl border p-5 text-left transition ${service.id === serviceId ? "border-[#3dbf74] bg-[#e9faef] ring-2 ring-[#3ee58c]/20" : "border-[#dfe5da] hover:border-[#a9b8ac] hover:bg-[#fafcf8]"}`}><span className="font-semibold text-[#10231d]">{service.name}</span><span className="mt-5 flex items-end justify-between gap-3"><span className="text-sm text-[#718178]">{service.durationMinutes} минут</span><span className="font-semibold text-[#294739]">{formatPrice(service.price)}</span></span></button>)}</div></div>}

              {step === 2 && <div><h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#10231d]">Выберите специалиста</h2><p className="mt-2 text-sm text-[#718178]">Показываем только сотрудников, которые выполняют выбранную услугу.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{availableStaff.map((member) => <button type="button" key={member.id} onClick={() => selectStaff(member.id)} aria-pressed={member.id === staffId} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${member.id === staffId ? "border-[#3dbf74] bg-[#e9faef] ring-2 ring-[#3ee58c]/20" : "border-[#dfe5da] hover:border-[#a9b8ac]"}`}><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#dff7e8] font-bold text-[#237347]">{member.name.slice(0, 1)}</span><span><span className="block font-semibold text-[#10231d]">{member.name}</span><span className="mt-1 block text-xs text-[#718178]">Доступна для записи</span></span></button>)}</div></div>}

              {step === 3 && <div><h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#10231d]">Дата и свободное время</h2><p className="mt-2 text-sm text-[#718178]">Выберите день, затем подходящий интервал.</p><label className="mt-6 block max-w-sm"><span className="mb-2 block text-sm font-semibold text-[#385145]">Дата</span><input type="date" value={date} min={getToday()} onChange={(event) => selectDate(event.target.value)} className="w-full rounded-2xl border border-[#d5ddd5] bg-white px-4 py-3 text-[#10231d] outline-none transition focus:border-[#47b875] focus:ring-4 focus:ring-[#3ee58c]/10" /></label>{date && <div className="mt-7"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-[#385145]">Свободное время</p><span className="text-xs text-[#7e8e85]">Доступно: {availableSlotCount}</span></div>{availableSlotCount === 0 ? <div className="mt-3 rounded-2xl border border-[#f0d5aa] bg-[#fff8e9] p-4 text-sm leading-6 text-[#7b5a25]">На эту дату свободных окон нет. Пожалуйста, выберите другую дату.</div> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{availableSlots.map((slot) => <button type="button" key={slot} onClick={() => { setTime(slot); setError(""); }} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${time === slot ? "border-[#3dbf74] bg-[#e5faed] text-[#17633c] ring-2 ring-[#3ee58c]/20" : "border-[#d5ddd5] text-[#385145] hover:border-[#7fad8d] hover:bg-[#f5faf5]"}`}>{slot}</button>)}</div>}</div>}</div>}

              {step === 4 && <form id="booking-contact-form" onSubmit={submitBooking}><h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#10231d]">Ваши контакты</h2><p className="mt-2 text-sm text-[#718178]">Укажите данные, чтобы завершить запись.</p><div className="mt-6 grid gap-5"><label><span className="mb-2 block text-sm font-semibold text-[#385145]">Имя клиента</span><input value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" placeholder="Например, Алина" className="w-full rounded-2xl border border-[#d5ddd5] px-4 py-3 outline-none transition placeholder:text-[#a1aca5] focus:border-[#47b875] focus:ring-4 focus:ring-[#3ee58c]/10" /></label><label><span className="mb-2 block text-sm font-semibold text-[#385145]">Телефон или WhatsApp</span><input type="tel" value={contact} onChange={(event) => setContact(event.target.value)} autoComplete="tel" placeholder="+7 700 000 00 00" className="w-full rounded-2xl border border-[#d5ddd5] px-4 py-3 outline-none transition placeholder:text-[#a1aca5] focus:border-[#47b875] focus:ring-4 focus:ring-[#3ee58c]/10" /></label></div></form>}
            </div>

            {error && <p role="alert" className="mt-6 rounded-2xl border border-[#f0c6c1] bg-[#fff1ef] p-4 text-sm leading-6 text-[#9a4036]">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#edf0ea] pt-5">{step > 1 ? <button type="button" onClick={goBack} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#607068] transition hover:bg-[#f3f6f1]">Назад</button> : <span />}{step < 4 ? <button type="button" onClick={goNext} disabled={(step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && (!date || !time))} className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244137] disabled:cursor-not-allowed disabled:bg-[#b8c0bb]">Продолжить</button> : <button type="submit" form="booking-contact-form" className="rounded-xl bg-[#10231d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">Подтвердить запись</button>}</div>
          </section>

          <BookingSummary service={selectedService} staff={selectedStaff} date={date} time={time} formatDate={formatDate} formatPrice={formatPrice} />
        </div>
      </div>
    </main>
  );
}
