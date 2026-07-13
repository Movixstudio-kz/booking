"use client";

import { useEffect, useState } from "react";
import type { BookingRecord } from "@/features/booking/types";
import { AppointmentDialog } from "@/features/calendar/components/AppointmentDialog";
import { CalendarToolbar } from "@/features/calendar/components/CalendarToolbar";
import { DayView } from "@/features/calendar/components/DayView";
import { MonthView } from "@/features/calendar/components/MonthView";
import { WeekView } from "@/features/calendar/components/WeekView";
import { useCalendarData } from "@/features/calendar/hooks";
import type { CalendarDialogMode, CalendarView } from "@/features/calendar/types";
import { moveCursor, toDateKey } from "@/features/calendar/utils";

export function CalendarScreen() {
  const [cursor, setCursor] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("day");
  const [dialogMode, setDialogMode] = useState<CalendarDialogMode | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<BookingRecord | null>(null);
  const { appointments, activeStaff, activeServices, saveAppointment, removeAppointment } = useCalendarData();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCursor(new Date()));
    return () => cancelAnimationFrame(frame);
  }, []);

  function closeDialog() {
    setDialogMode(null);
    setSelectedAppointment(null);
  }

  function selectAppointment(appointment: BookingRecord) {
    setSelectedAppointment(appointment);
    setDialogMode("view");
  }

  function deleteSelected(id: string) {
    if (removeAppointment(id)) closeDialog();
  }

  if (!cursor) {
    return <main className="p-4 sm:p-6 lg:p-8"><div className="h-40 animate-pulse rounded-2xl border border-[#dfe5da] bg-white" /></main>;
  }

  return <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1600px]"><div className="mb-6"><p className="text-sm font-semibold text-[#6c8176]">Расписание</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-[#10231d]">Календарь записей</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#718178]">Управляйте загрузкой сотрудников, создавайте записи и контролируйте статусы в одном календаре.</p></div><CalendarToolbar cursor={cursor} view={view} onViewChange={setView} onToday={() => setCursor(new Date())} onMove={(direction) => setCursor((current) => moveCursor(current ?? new Date(), view, direction))} onCreate={() => { setSelectedAppointment(null); setDialogMode("create"); }} />{activeStaff.length === 0 ? <div className="mt-4 rounded-2xl border border-[#dfe5da] bg-white p-10 text-center"><h2 className="text-lg font-semibold text-[#10231d]">Нет активных сотрудников</h2><p className="mt-2 text-sm text-[#718178]">Добавьте или активируйте сотрудника, чтобы начать работу с расписанием.</p></div> : view === "day" ? <DayView date={cursor} appointments={appointments} staff={activeStaff} onSelect={selectAppointment} /> : view === "week" ? <WeekView date={cursor} appointments={appointments} staff={activeStaff} onSelect={selectAppointment} /> : <MonthView date={cursor} appointments={appointments} onSelect={selectAppointment} />}</div>{dialogMode && <AppointmentDialog key={`${dialogMode}-${selectedAppointment?.id ?? toDateKey(cursor)}`} mode={dialogMode} appointment={selectedAppointment} defaultDate={toDateKey(cursor)} staff={activeStaff} services={activeServices} onClose={closeDialog} onEdit={() => setDialogMode("edit")} onDelete={deleteSelected} onSave={saveAppointment} />}</main>;
}
