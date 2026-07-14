"use client";

import { useState, type FormEvent } from "react";
import type { StaffSchedule } from "@/features/schedule/types";
import { isValidInterval } from "@/features/schedule/utils";

type ScheduleExceptionsEditorProps = {
  schedule: StaffSchedule;
  disabled: boolean;
  onChange: (schedule: StaffSchedule) => void;
  onValidationError: (message: string) => void;
};

function createId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
}
function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

export function ScheduleExceptionsEditor({ schedule, disabled, onChange, onValidationError }: ScheduleExceptionsEditorProps) {
  const [breakForm, setBreakForm] = useState({ date: "", start: "13:00", end: "14:00", title: "Обед" });
  const [dayOffDate, setDayOffDate] = useState("");
  const [vacationForm, setVacationForm] = useState({ startDate: "", endDate: "" });
  const [extraForm, setExtraForm] = useState({ date: "", start: "09:00", end: "12:00", title: "Дополнительная смена" });

  function addBreak(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!breakForm.date || !breakForm.title.trim() || !isValidInterval(breakForm)) {
      onValidationError("Укажите дату, название и корректное время перерыва.");
      return;
    }
    onChange({
      ...schedule,
      breaks: [...schedule.breaks, { ...breakForm, id: createId("break"), title: breakForm.title.trim() }],
    });
  }

  function addDayOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dayOffDate) {
      onValidationError("Выберите дату выходного.");
      return;
    }
    onChange({ ...schedule, daysOff: [...new Set([...schedule.daysOff, dayOffDate])].sort() });
    setDayOffDate("");
  }

  function addVacation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vacationForm.startDate || !vacationForm.endDate || vacationForm.startDate > vacationForm.endDate) {
      onValidationError("Укажите корректный период отпуска.");
      return;
    }
    onChange({
      ...schedule,
      vacations: [...schedule.vacations, { id: createId("vacation"), ...vacationForm }],
    });
  }

  function addExtraInterval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!extraForm.date || !isValidInterval(extraForm)) {
      onValidationError("Укажите дату и корректное время дополнительного окна.");
      return;
    }
    onChange({
      ...schedule,
      extraWorkingIntervals: [
        ...schedule.extraWorkingIntervals,
        { ...extraForm, id: createId("extra"), title: extraForm.title.trim() || "Дополнительная смена" },
      ],
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ExceptionCard title="Перерывы" description="Обед и другие паузы внутри рабочей смены.">
        <form onSubmit={addBreak} className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={breakForm.date} disabled={disabled} onChange={(value) => setBreakForm({ ...breakForm, date: value })} label="Дата" />
          <Input value={breakForm.title} disabled={disabled} onChange={(value) => setBreakForm({ ...breakForm, title: value })} label="Название" />
          <Input type="time" value={breakForm.start} disabled={disabled} onChange={(value) => setBreakForm({ ...breakForm, start: value })} label="Начало" />
          <Input type="time" value={breakForm.end} disabled={disabled} onChange={(value) => setBreakForm({ ...breakForm, end: value })} label="Окончание" />
          <AddButton disabled={disabled}>Добавить перерыв</AddButton>
        </form>
        <div className="mt-4 space-y-2">
          {schedule.breaks.map((item) => (
            <ExceptionRow key={item.id} title={item.title} meta={`${formatDate(item.date)} · ${item.start}–${item.end}`} disabled={disabled} onDelete={() => onChange({ ...schedule, breaks: schedule.breaks.filter((entry) => entry.id !== item.id) })} />
          ))}
          {!schedule.breaks.length && <EmptyState />}
        </div>
      </ExceptionCard>

      <ExceptionCard title="Индивидуальные выходные" description="Полностью закрытые для записи даты.">
        <form onSubmit={addDayOff} className="flex flex-wrap items-end gap-2">
          <Input type="date" value={dayOffDate} disabled={disabled} onChange={setDayOffDate} label="Дата" />
          <AddButton disabled={disabled}>Добавить выходной</AddButton>
        </form>
        <div className="mt-4 space-y-2">
          {schedule.daysOff.map((date) => (
            <ExceptionRow key={date} title="Выходной" meta={formatDate(date)} disabled={disabled} onDelete={() => onChange({ ...schedule, daysOff: schedule.daysOff.filter((item) => item !== date) })} />
          ))}
          {!schedule.daysOff.length && <EmptyState />}
        </div>
      </ExceptionCard>

      <ExceptionCard title="Отпуск" description="Диапазон дат, недоступный для онлайн-записи.">
        <form onSubmit={addVacation} className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={vacationForm.startDate} disabled={disabled} onChange={(value) => setVacationForm({ ...vacationForm, startDate: value })} label="С даты" />
          <Input type="date" value={vacationForm.endDate} disabled={disabled} onChange={(value) => setVacationForm({ ...vacationForm, endDate: value })} label="По дату" />
          <AddButton disabled={disabled}>Добавить отпуск</AddButton>
        </form>
        <div className="mt-4 space-y-2">
          {schedule.vacations.map((item) => (
            <ExceptionRow key={item.id} title={item.title || "Отпуск"} meta={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`} disabled={disabled} onDelete={() => onChange({ ...schedule, vacations: schedule.vacations.filter((entry) => entry.id !== item.id) })} />
          ))}
          {!schedule.vacations.length && <EmptyState />}
        </div>
      </ExceptionCard>

      <ExceptionCard title="Дополнительные окна" description="Рабочее время вне обычного недельного графика.">
        <form onSubmit={addExtraInterval} className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={extraForm.date} disabled={disabled} onChange={(value) => setExtraForm({ ...extraForm, date: value })} label="Дата" />
          <Input value={extraForm.title} disabled={disabled} onChange={(value) => setExtraForm({ ...extraForm, title: value })} label="Название" />
          <Input type="time" value={extraForm.start} disabled={disabled} onChange={(value) => setExtraForm({ ...extraForm, start: value })} label="Начало" />
          <Input type="time" value={extraForm.end} disabled={disabled} onChange={(value) => setExtraForm({ ...extraForm, end: value })} label="Окончание" />
          <AddButton disabled={disabled}>Добавить окно</AddButton>
        </form>
        <div className="mt-4 space-y-2">
          {schedule.extraWorkingIntervals.map((item) => (
            <ExceptionRow key={item.id} title={item.title || "Дополнительная смена"} meta={`${formatDate(item.date)} · ${item.start}–${item.end}`} disabled={disabled} onDelete={() => onChange({ ...schedule, extraWorkingIntervals: schedule.extraWorkingIntervals.filter((entry) => entry.id !== item.id) })} />
          ))}
          {!schedule.extraWorkingIntervals.length && <EmptyState />}
        </div>
      </ExceptionCard>
    </div>
  );
}

type ExceptionCardProps = { title: string; description: string; children: React.ReactNode };

function ExceptionCard({ title, description, children }: ExceptionCardProps) {
  return <section className="rounded-2xl border border-[#dfe5da] bg-white p-5 sm:p-6"><h3 className="text-lg font-semibold tracking-[-0.03em] text-[#10231d]">{title}</h3><p className="mt-1 text-sm text-[#718178]">{description}</p><div className="mt-5">{children}</div></section>;
}

type InputProps = { label: string; value: string; disabled: boolean; type?: "text" | "date" | "time"; onChange: (value: string) => void };

function Input({ label, value, disabled, type = "text", onChange }: InputProps) {
  return <label className="min-w-0 flex-1 text-xs font-semibold text-[#607068]">{label}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d5ddd5] bg-white px-3 py-2.5 text-sm font-normal text-[#385145] outline-none focus:border-[#47b875] disabled:bg-[#f4f6f2]" /></label>;
}

function AddButton({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return <button type="submit" disabled={disabled} className="self-end rounded-xl bg-[#10231d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244137] disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}

function ExceptionRow({ title, meta, disabled, onDelete }: { title: string; meta: string; disabled: boolean; onDelete: () => void }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f4] px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#385145]">{title}</p><p className="mt-0.5 text-xs text-[#7d8b83]">{meta}</p></div><button type="button" disabled={disabled} onClick={onDelete} className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#a3483e] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">Удалить</button></div>;
}

function EmptyState() {
  return <p className="rounded-xl border border-dashed border-[#dfe5da] px-3 py-4 text-center text-xs text-[#94a098]">Пока ничего не добавлено</p>;
}
