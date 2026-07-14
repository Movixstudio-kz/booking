import type { TimeInterval, WeeklySchedule } from "@/features/schedule/types";
import { WEEKDAYS } from "@/features/schedule/types";

const weekdayLabels: Record<(typeof WEEKDAYS)[number], string> = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
  sunday: "Воскресенье",
};

type WeeklyScheduleEditorProps = {
  value: WeeklySchedule;
  disabled: boolean;
  onChange: (schedule: WeeklySchedule) => void;
};

export function WeeklyScheduleEditor({ value, disabled, onChange }: WeeklyScheduleEditorProps) {
  function updateDay(day: (typeof WEEKDAYS)[number], intervals: TimeInterval[]) {
    onChange({ ...value, [day]: intervals });
  }

  function updateInterval(day: (typeof WEEKDAYS)[number], index: number, field: keyof TimeInterval, nextValue: string) {
    updateDay(day, value[day].map((interval, intervalIndex) => intervalIndex === index ? { ...interval, [field]: nextValue } : interval));
  }

  return (
    <section className="rounded-2xl border border-[#dfe5da] bg-white p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#10231d]">Рабочая неделя</h3>
        <p className="mt-1 text-sm text-[#718178]">Добавляйте одну или несколько смен на каждый день.</p>
      </div>

      <div className="mt-5 divide-y divide-[#edf0ea]">
        {WEEKDAYS.map((day) => {
          const intervals = value[day];
          const isWorkingDay = intervals.length > 0;

          return (
            <div key={day} className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[150px_1fr]">
              <label className="flex items-center gap-3 self-start pt-2 text-sm font-semibold text-[#385145]">
                <input
                  type="checkbox"
                  checked={isWorkingDay}
                  disabled={disabled}
                  onChange={(event) => updateDay(day, event.target.checked ? [{ start: "09:00", end: "18:00" }] : [])}
                  className="size-4 accent-[#237347]"
                />
                {weekdayLabels[day]}
              </label>

              <div className="space-y-2">
                {intervals.map((interval, index) => (
                  <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={interval.start}
                      disabled={disabled}
                      onChange={(event) => updateInterval(day, index, "start", event.target.value)}
                      className="rounded-xl border border-[#d5ddd5] bg-white px-3 py-2 text-sm text-[#385145] outline-none focus:border-[#47b875] disabled:bg-[#f4f6f2]"
                    />
                    <span className="text-sm text-[#94a098]">—</span>
                    <input
                      type="time"
                      value={interval.end}
                      disabled={disabled}
                      onChange={(event) => updateInterval(day, index, "end", event.target.value)}
                      className="rounded-xl border border-[#d5ddd5] bg-white px-3 py-2 text-sm text-[#385145] outline-none focus:border-[#47b875] disabled:bg-[#f4f6f2]"
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => updateDay(day, intervals.filter((_, intervalIndex) => intervalIndex !== index))}
                      className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#a3483e] transition hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Удалить
                    </button>
                  </div>
                ))}

                {isWorkingDay && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateDay(day, [...intervals, { start: "18:00", end: "20:00" }])}
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#237347] transition hover:bg-[#e8faef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Добавить интервал
                  </button>
                )}

                {!isWorkingDay && <p className="py-2 text-sm text-[#9aa59e]">Выходной</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
