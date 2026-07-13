import type { CalendarView } from "@/features/calendar/types";
import { formatCalendarTitle } from "@/features/calendar/utils";

type CalendarToolbarProps = {
  cursor: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  onMove: (direction: -1 | 1) => void;
  onCreate: () => void;
};

export function CalendarToolbar({ cursor, view, onViewChange, onToday, onMove, onCreate }: CalendarToolbarProps) {
  return <div className="rounded-2xl border border-[#dfe5da] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2"><button type="button" onClick={onToday} className="rounded-xl border border-[#d5ddd5] px-3 py-2 text-sm font-semibold text-[#365146] hover:bg-[#f3f6f1]">Сегодня</button><button type="button" aria-label="Назад" onClick={() => onMove(-1)} className="grid size-10 place-items-center rounded-xl border border-[#d5ddd5] text-lg text-[#365146] hover:bg-[#f3f6f1]">‹</button><button type="button" aria-label="Вперёд" onClick={() => onMove(1)} className="grid size-10 place-items-center rounded-xl border border-[#d5ddd5] text-lg text-[#365146] hover:bg-[#f3f6f1]">›</button></div><h2 className="order-last w-full text-xl font-semibold capitalize tracking-[-0.035em] text-[#10231d] lg:order-none lg:w-auto">{formatCalendarTitle(cursor, view)}</h2><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl bg-[#f1f4ef] p-1">{(["day", "week", "month"] as CalendarView[]).map((item) => <button type="button" key={item} onClick={() => onViewChange(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${view === item ? "bg-white text-[#10231d] shadow-sm" : "text-[#718178]"}`}>{item === "day" ? "День" : item === "week" ? "Неделя" : "Месяц"}</button>)}</div><button type="button" onClick={onCreate} className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#244137]">+ Создать запись</button></div></div></div>;
}
