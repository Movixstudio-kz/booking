"use client";

import { useEffect, useState } from "react";
import type { BookingRecord, BookingStatus } from "@/features/booking/types";
import { AppointmentDialog } from "@/features/calendar/components/AppointmentDialog";
import { CalendarToolbar } from "@/features/calendar/components/CalendarToolbar";
import { DayView } from "@/features/calendar/components/DayView";
import { MonthView } from "@/features/calendar/components/MonthView";
import { WeekView } from "@/features/calendar/components/WeekView";
import { useCalendarData } from "@/features/calendar/hooks";
import type { CalendarDialogMode, CalendarView } from "@/features/calendar/types";
import { moveCursor, toDateKey } from "@/features/calendar/utils";
import { createDefaultStaffSchedule } from "@/features/schedule/data";
import { canChangeAppointmentStatus, canCreateAppointment, canDeleteAppointments, canEditAppointment, canViewAppointment } from "@/lib/permissions";

const deniedMessage = "Недостаточно прав для выполнения этого действия.";

export function CalendarScreen() {
  const [cursor, setCursor] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("day");
  const [dialogMode, setDialogMode] = useState<CalendarDialogMode | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<BookingRecord | null>(null);
  const [message, setMessage] = useState("");
  const { currentUser, appointments, activeStaff, activeServices, schedules, saveAppointment, changeStatus, removeAppointment } = useCalendarData();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCursor(new Date()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const visibleSchedules = activeStaff.map((member) => schedules.find((schedule) => schedule.staffId === member.id) ?? createDefaultStaffSchedule(member.id));

  function closeDialog() {
    setDialogMode(null);
    setSelectedAppointment(null);
  }

  function selectAppointment(appointment: BookingRecord) {
    if (!canViewAppointment(currentUser, appointment)) {
      setMessage(deniedMessage);
      return;
    }
    setMessage("");
    setSelectedAppointment(appointment);
    setDialogMode("view");
  }

  function createAppointment() {
    if (!canCreateAppointment(currentUser)) {
      setMessage(deniedMessage);
      return;
    }
    setMessage("");
    setSelectedAppointment(null);
    setDialogMode("create");
  }

  function editSelected() {
    if (!selectedAppointment || !canEditAppointment(currentUser, selectedAppointment)) {
      setMessage(deniedMessage);
      return;
    }
    setDialogMode("edit");
  }

  function deleteSelected(id: string) {
    if (!canDeleteAppointments(currentUser)) {
      setMessage(deniedMessage);
      return;
    }
    if (removeAppointment(id)) {
      setMessage("");
      closeDialog();
    }
  }

  function updateSelectedStatus(appointment: BookingRecord, status: BookingStatus): boolean {
    if (!canChangeAppointmentStatus(currentUser, appointment)) {
      setMessage(deniedMessage);
      return false;
    }
    const result = changeStatus(appointment, status);
    if (result) {
      setSelectedAppointment({ ...appointment, status });
      setMessage("");
    }
    return result;
  }

  if (!cursor) {
    return <main className="p-4 sm:p-6 lg:p-8"><div className="h-40 animate-pulse rounded-2xl border border-[#dfe5da] bg-white" /></main>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#6c8176]">Расписание</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-[#10231d]">Календарь записей</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718178]">Управляйте загрузкой сотрудников, записями и рабочими исключениями в одном календаре.</p>
        </div>

        {message && <p role="alert" className="mb-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#9a4036]">{message}</p>}

        <CalendarToolbar
          cursor={cursor}
          view={view}
          canCreate={canCreateAppointment(currentUser)}
          onViewChange={setView}
          onToday={() => setCursor(new Date())}
          onMove={(direction) => setCursor((current) => moveCursor(current ?? new Date(), view, direction))}
          onCreate={createAppointment}
        />

        {activeStaff.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-[#dfe5da] bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-[#10231d]">Нет доступных сотрудников</h2>
            <p className="mt-2 text-sm text-[#718178]">Для выбранной роли нет доступного рабочего графика.</p>
          </div>
        ) : view === "day" ? (
          <DayView date={cursor} appointments={appointments} staff={activeStaff} schedules={visibleSchedules} onSelect={selectAppointment} />
        ) : view === "week" ? (
          <WeekView date={cursor} appointments={appointments} staff={activeStaff} schedules={visibleSchedules} onSelect={selectAppointment} />
        ) : (
          <MonthView date={cursor} appointments={appointments} staff={activeStaff} schedules={visibleSchedules} onSelect={selectAppointment} />
        )}
      </div>

      {dialogMode && (
        <AppointmentDialog
          key={`${dialogMode}-${selectedAppointment?.id ?? toDateKey(cursor)}`}
          mode={dialogMode}
          appointment={selectedAppointment}
          defaultDate={toDateKey(cursor)}
          staff={activeStaff}
          services={activeServices}
          canEdit={Boolean(selectedAppointment && canEditAppointment(currentUser, selectedAppointment))}
          canDelete={canDeleteAppointments(currentUser)}
          canChangeStatus={Boolean(selectedAppointment && canChangeAppointmentStatus(currentUser, selectedAppointment))}
          onClose={closeDialog}
          onEdit={editSelected}
          onDelete={deleteSelected}
          onStatusChange={updateSelectedStatus}
          onSave={saveAppointment}
        />
      )}
    </main>
  );
}
