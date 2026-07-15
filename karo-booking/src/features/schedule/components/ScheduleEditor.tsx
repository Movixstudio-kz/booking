"use client";

import { useState } from "react";
import { useCurrentUserStaffSchedules } from "@/features/schedule/hooks";
import type { StaffSchedule } from "@/features/schedule/types";
import { ScheduleExceptionsEditor } from "./ScheduleExceptionsEditor";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";

const FORBIDDEN_MESSAGE = "Недостаточно прав для выполнения этого действия.";

type ScheduleEditorStaff = {
  id: string;
  name: string;
  calendarColor?: string;
};

export type ScheduleEditorProps = {
  staff: ScheduleEditorStaff[];
  canEditStaffSchedule: (staffId: string) => boolean;
  lockedStaffId?: string;
  onPermissionDenied?: (message: string) => void;
};

export function ScheduleEditor({ staff, canEditStaffSchedule, lockedStaffId, onPermissionDenied }: ScheduleEditorProps) {
  const [internalStaffId, setInternalStaffId] = useState(lockedStaffId ?? staff[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const { getSchedule, updateSchedule } = useCurrentUserStaffSchedules();
  const fallbackStaffId = staff[0]?.id ?? "";
  const selectedStaffId = lockedStaffId ?? (staff.some((member) => member.id === internalStaffId) ? internalStaffId : fallbackStaffId);
  const selectedStaff = staff.find((member) => member.id === selectedStaffId);
  const schedule = selectedStaffId ? getSchedule(selectedStaffId) : null;
  const canEdit = Boolean(selectedStaffId && canEditStaffSchedule(selectedStaffId));

  function denyPermission() {
    setMessage(FORBIDDEN_MESSAGE);
    onPermissionDenied?.(FORBIDDEN_MESSAGE);
  }

  function selectStaff(staffId: string) {
    if (lockedStaffId && staffId !== lockedStaffId) {
      denyPermission();
      return;
    }
    if (!staff.some((member) => member.id === staffId)) {
      denyPermission();
      return;
    }
    setInternalStaffId(staffId);
    setMessage("");
  }

  async function applySchedule(nextSchedule: StaffSchedule) {
    if (!selectedStaffId || nextSchedule.staffId !== selectedStaffId || !canEditStaffSchedule(selectedStaffId)) {
      denyPermission();
      return;
    }

    if (!await updateSchedule(nextSchedule)) {
      setMessage("Не удалось сохранить график. Проверьте даты и интервалы времени.");
      return;
    }
    setMessage("Изменения сохранены.");
  }

  if (!schedule || !selectedStaffId) {
    return (
      <section className="rounded-2xl border border-[#dfe5da] bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-[#10231d]">Рабочий график</h2>
        <p className="mt-2 text-sm text-[#718178]">Добавьте сотрудника, чтобы настроить расписание.</p>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="staff-schedule-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#619276]">Расписание команды</p>
          <h2 id="staff-schedule-title" className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-[#10231d] sm:text-3xl">Рабочий график</h2>
          <p className="mt-2 text-sm text-[#607068]">Смены, перерывы, выходные и индивидуальные рабочие окна.</p>
        </div>

        {!lockedStaffId && (
          <label className="min-w-[240px] text-xs font-semibold text-[#607068]">
            Сотрудник
            <select
              value={selectedStaffId}
              onChange={(event) => selectStaff(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#d5ddd5] bg-white px-3 py-3 text-sm font-semibold text-[#385145] outline-none focus:border-[#47b875]"
            >
              {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe5da] bg-[#f8faf6] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full" style={{ backgroundColor: selectedStaff?.calendarColor ?? "#47b875" }} />
          <div>
            <p className="text-sm font-semibold text-[#385145]">{selectedStaff?.name ?? selectedStaffId}</p>
            <p className="text-xs text-[#7d8b83]">{canEdit ? "Редактирование доступно" : "Только просмотр"}</p>
          </div>
        </div>
        {!canEdit && <span className="rounded-full bg-[#eef1ed] px-3 py-1.5 text-xs font-semibold text-[#718178]">Изменения недоступны</span>}
      </div>

      {message && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${message === FORBIDDEN_MESSAGE || message.startsWith("Не удалось") ? "bg-[#fff1ef] text-[#9a4036]" : "bg-[#e8faef] text-[#237347]"}`}
        >
          {message}
        </p>
      )}

      <div className="mt-4 space-y-4">
        <WeeklyScheduleEditor
          value={schedule.weeklySchedule}
          disabled={!canEdit}
          onChange={(weeklySchedule) => applySchedule({ ...schedule, weeklySchedule })}
        />
        <ScheduleExceptionsEditor
          key={selectedStaffId}
          schedule={schedule}
          disabled={!canEdit}
          onChange={applySchedule}
          onValidationError={setMessage}
        />
      </div>
    </section>
  );
}
