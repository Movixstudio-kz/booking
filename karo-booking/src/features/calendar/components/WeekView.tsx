import type { BookingRecord } from "@/features/booking/types";
import { calendarStatusStyles, getEndTime, getWeekDays, toDateKey } from "@/features/calendar/utils";
import type { StaffSchedule } from "@/features/schedule/types";
import { getScheduleVisualBlocks } from "@/features/schedule/utils";
import type { StaffItem } from "@/features/staff/types";

type WeekViewProps = {
  date: Date;
  appointments: BookingRecord[];
  staff: StaffItem[];
  schedules: StaffSchedule[];
  onSelect: (appointment: BookingRecord) => void;
};

export function WeekView({ date, appointments, staff, schedules, onSelect }: WeekViewProps) {
  const days = getWeekDays(date);

  return <section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe5da] bg-white"><div className="overflow-x-auto"><div className="min-w-[1280px]"><div className="grid grid-cols-[180px_repeat(7,minmax(150px,1fr))] border-b border-[#dfe5da] bg-[#f8faf6]"><div className="px-4 py-4 text-xs font-semibold text-[#8a9990]">Сотрудник</div>{days.map((day) => <div key={toDateKey(day)} className="border-l border-[#dfe5da] px-3 py-3 text-center"><p className="text-xs font-semibold uppercase text-[#8a9990]">{day.toLocaleDateString("ru-RU", { weekday: "short" })}</p><p className="mt-1 text-lg font-semibold text-[#10231d]">{day.getDate()}</p></div>)}</div>{staff.map((member) => { const schedule = schedules.find((item) => item.staffId === member.id); return <div key={member.id} className="grid min-h-44 grid-cols-[180px_repeat(7,minmax(150px,1fr))] border-b border-[#edf0ea] last:border-b-0"><div className="flex items-start gap-2 px-4 py-4"><span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: member.calendarColor }} /><div><p className="text-sm font-semibold text-[#385145]">{member.name}</p><p className="mt-1 text-xs text-[#8a9990]">{member.position}</p></div></div>{days.map((day) => { const key = toDateKey(day); const dayAppointments = appointments.filter((appointment) => appointment.date === key && appointment.staffId === member.id).sort((left, right) => left.time.localeCompare(right.time)); const blocks = schedule ? getScheduleVisualBlocks(schedule, key) : []; const fullDayBlock = blocks.find((block) => block.kind === "day_off" || block.kind === "vacation"); const breaks = blocks.filter((block) => block.kind === "break"); return <div key={key} className={`space-y-2 border-l border-[#edf0ea] p-2 ${fullDayBlock?.kind === "vacation" ? "bg-[#faf7ff]" : fullDayBlock ? "bg-[#fff8f6]" : ""}`}>{fullDayBlock && <p className={`rounded-lg px-2 py-2 text-center text-[10px] font-semibold ${fullDayBlock.kind === "vacation" ? "bg-[#f2edff] text-[#7053a8]" : "bg-[#fff0ee] text-[#9a4036]"}`}>{fullDayBlock.title}</p>}{breaks.map((block) => <p key={block.id} className="rounded-lg bg-[#fff6dc] px-2 py-1.5 text-[9px] font-semibold text-[#826816]">{block.title} {block.start}–{block.end}</p>)}{dayAppointments.map((appointment) => <button type="button" key={appointment.id} onClick={() => onSelect(appointment)} className={`w-full rounded-xl border p-2.5 text-left ${calendarStatusStyles[appointment.status]}`}><span className="block text-[10px] font-semibold">{appointment.time}–{getEndTime(appointment.time, appointment.durationMinutes)}</span><span className="mt-1.5 block truncate text-xs font-bold">{appointment.serviceName}</span><span className="mt-1 block truncate text-[11px]">{appointment.clientName}</span></button>)}{dayAppointments.length === 0 && !fullDayBlock && <p className="py-4 text-center text-[10px] text-[#b0b8b3]">Свободно</p>}</div>; })}</div>; })}</div></div></section>;
}
