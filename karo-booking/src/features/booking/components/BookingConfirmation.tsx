import type { BookingRecord } from "@/features/booking/types";

type BookingConfirmationProps = {
  booking: BookingRecord;
  onCreateAnother: () => void;
  formatDate: (date: string) => string;
  formatPrice: (price: number) => string;
};

export function BookingConfirmation({ booking, onCreateAnother, formatDate, formatPrice }: BookingConfirmationProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-[#dfe5da] bg-white p-6 shadow-xl shadow-[#315343]/5 sm:p-10">
      <div className="grid size-14 place-items-center rounded-2xl bg-[#dff9e8] text-2xl text-[#237347]">✓</div>
      <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">Запись подтверждена</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">До встречи, {booking.clientName}!</h1>
      <p className="mt-3 leading-7 text-[#607068]">Мы сохранили вашу запись на этом устройстве.</p>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          ["Услуга", booking.serviceName],
          ["Специалист", booking.staffName],
          ["Дата", formatDate(booking.date)],
          ["Время", booking.time],
          ["Стоимость", formatPrice(booking.price)],
          ["Телефон / WhatsApp", booking.contact],
        ].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f3f6f1] p-4"><dt className="text-xs font-medium text-[#7e8e85]">{label}</dt><dd className="mt-1 font-semibold text-[#24382f]">{value}</dd></div>)}
      </dl>

      <button type="button" onClick={onCreateAnother} className="mt-8 w-full rounded-2xl bg-[#10231d] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#244137]">
        Создать ещё одну запись
      </button>
    </div>
  );
}
