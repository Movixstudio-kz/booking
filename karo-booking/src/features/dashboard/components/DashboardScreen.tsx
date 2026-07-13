import { CalendarPreview } from "@/components/admin/CalendarPreview";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { dashboardMetrics } from "@/features/dashboard/data/dashboard-data";

export function DashboardScreen() {
  return <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 sm:py-9"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#619276]">Обзор бизнеса</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.055em] text-[#10231d] sm:text-4xl">Добрый день, Батима!</h2><p className="mt-2 text-[#607068]">Вот что происходит в вашем салоне сегодня.</p></div><button type="button" className="rounded-xl bg-[#10231d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]">+ Новая запись</button></div><section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{dashboardMetrics.map((metric) => <DashboardCard key={metric.label} {...metric} />)}</section><div className="mt-7"><CalendarPreview /></div></main>;
}
