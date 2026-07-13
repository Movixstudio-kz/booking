import type { BookingService, StaffMember } from "@/features/booking/types";

type BookingSummaryProps = {
  service?: BookingService;
  staff?: StaffMember;
  date: string;
  time: string;
  formatDate: (date: string) => string;
  formatPrice: (price: number) => string;
};

export function BookingSummary({ service, staff, date, time, formatDate, formatPrice }: BookingSummaryProps) {
  return (
    <aside className="rounded-3xl bg-[#10231d] p-6 text-white lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#75e5a3]">Ваша запись</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">KARO Beauty Studio</h2>
      <dl className="mt-8 space-y-5 text-sm">
        <div className="border-b border-white/10 pb-4"><dt className="text-white/50">Услуга</dt><dd className="mt-1 font-semibold">{service?.name ?? "Не выбрана"}</dd></div>
        <div className="border-b border-white/10 pb-4"><dt className="text-white/50">Специалист</dt><dd className="mt-1 font-semibold">{staff?.name ?? "Не выбран"}</dd></div>
        <div className="border-b border-white/10 pb-4"><dt className="text-white/50">Дата и время</dt><dd className="mt-1 font-semibold">{date ? formatDate(date) : "Не выбраны"}{time ? ` · ${time}` : ""}</dd></div>
        <div className="flex items-end justify-between gap-4"><div><dt className="text-white/50">К оплате</dt><dd className="mt-1 text-xl font-semibold">{service ? formatPrice(service.price) : "—"}</dd></div>{service && <span className="text-xs text-white/50">{service.durationMinutes} мин</span>}</div>
      </dl>
      <p className="mt-8 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-white/60">Подтверждение сохраняется только на этом устройстве. На этапе MVP данные не отправляются на сервер.</p>
    </aside>
  );
}
