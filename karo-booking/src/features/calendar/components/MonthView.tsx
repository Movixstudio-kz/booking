import type { BookingRecord } from "@/features/booking/types";
import { calendarStatusStyles, getMonthDays, toDateKey } from "@/features/calendar/utils";
import type { StaffSchedule } from "@/features/schedule/types";
import { isDateInVacation } from "@/features/schedule/utils";
import type { StaffItem } from "@/features/staff/types";

type MonthViewProps = { date: Date; appointments: BookingRecord[]; staff: StaffItem[]; schedules: StaffSchedule[]; onSelect: (appointment: BookingRecord) => void };

export function MonthView({ date, appointments, staff, schedules, onSelect }: MonthViewProps) {
  const days = getMonthDays(date);

  return <section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white"><div className="grid grid-cols-7 border-b border-[#edf0ea] bg-[#f8faf6]">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-[#7e8e85]">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const key = toDateKey(day); const dayAppointments = appointments.filter((appointment) => appointment.date === key).sort((left, right) => left.time.localeCompare(right.time)); const scheduleNotes = staff.flatMap((member) => { const schedule = schedules.find((item) => item.staffId === member.id); if (!schedule) return []; if (isDateInVacation(schedule, key)) return [`Отпуск: ${member.name}`]; if (schedule.daysOff.includes(key)) return [`Выходной: ${member.name}`]; return []; }); const appointmentLimit = scheduleNotes.length ? 2 : 3; const isCurrentMonth = day.getMonth() === date.getMonth(); return <div key={key} className="min-h-28 border-b border-r border-[#edf0ea] p-1.5 sm:min-h-36 sm:p-2"><p className={`text-xs font-semibold ${isCurrentMonth ? "text-[#385145]" : "text-[#b0b8b3]"}`}>{day.getDate()}</p><div className="mt-1.5 space-y-1">{scheduleNotes.slice(0, 1).map((note) => <p key={note} className="truncate rounded-md bg-[#f2edff] px-1.5 py-1 text-[8px] font-semibold text-[#7053a8] sm:text-[9px]">{note}</p>)}{dayAppointments.slice(0, appointmentLimit).map((appointment) => <button type="button" key={appointment.id} onClick={() => onSelect(appointment)} className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-[9px] font-semibold sm:text-[10px] ${calendarStatusStyles[appointment.status]}`}>{appointment.time} {appointment.clientName}</button>)}{dayAppointments.length > appointmentLimit && <p className="px-1 text-[9px] text-[#718178]">ещё {dayAppointments.length - appointmentLimit}</p>}</div></div>; })}</div></section>;
}
