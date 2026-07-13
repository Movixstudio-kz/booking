import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { businesses } from "@/features/landing/data/businesses";
import { benefits } from "@/features/landing/data/benefits";

function ArrowIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg>;
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f1]">
      <SiteHeader />
      <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d7ded2] bg-white/70 px-3.5 py-2 text-sm font-medium text-[#466056]"><span className="size-2 rounded-full bg-[#3ee58c]" />Всё для записи — в одном месте</p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.065em] text-[#10231d] sm:text-6xl lg:text-7xl">Онлайн-запись <span className="text-[#5c776a]">для бизнеса</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#607068]">KARO Booking помогает принимать клиентов 24/7, видеть расписание команды и уделять больше времени своему делу.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/booking" className="inline-flex items-center gap-2 rounded-full bg-[#10231d] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#10231d]/10 transition hover:-translate-y-0.5 hover:bg-[#244137]">Начать бесплатно <ArrowIcon /></Link>
            <a href="#demo" className="rounded-full border border-[#cfd8cf] bg-white px-5 py-3.5 text-sm font-semibold text-[#486055] transition hover:border-[#9faea2] hover:bg-[#f9fbf7]">Демо</a>
          </div>
          <p className="mt-5 text-sm text-[#839087]">Без карты · Настройка за несколько минут</p>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -right-12 -top-12 size-52 rounded-full bg-[#b7f6d0] blur-3xl" />
          <div className="relative rounded-[32px] border border-white/80 bg-white p-4 shadow-2xl shadow-[#315343]/10">
            <div className="flex items-center justify-between border-b border-[#edf0ea] px-3 pb-4"><span className="text-sm font-semibold">Расписание</span><span className="rounded-full bg-[#e8faef] px-2.5 py-1 text-xs font-semibold text-[#28734a]">Сегодня</span></div>
            <div className="grid grid-cols-[70px_1fr] gap-4 px-3 pt-5 text-sm">
              <div className="space-y-9 pt-3 text-xs text-[#92a097]"><p>10:00</p><p>11:00</p><p>12:00</p><p>13:00</p></div>
              <div className="relative h-72 rounded-2xl bg-[#f5f7f2] p-3">
                <div className="rounded-xl bg-[#d8f9e4] p-3 text-xs text-[#286342]"><p className="font-bold">10:00 · Алина</p><p className="mt-1 text-[#57816a]">Маникюр · Мария</p></div>
                <div className="mt-5 rounded-xl bg-[#e8ece7] p-3 text-xs text-[#476056]"><p className="font-bold">11:30 · Дмитрий</p><p className="mt-1 text-[#728078]">Стрижка · Алексей</p></div>
                <div className="mt-5 rounded-xl border border-dashed border-[#b7c1b9] p-3 text-xs text-[#789087]">Свободное время</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[#10231d] p-4 text-white"><p className="text-xs text-white/60">Новые записи за неделю</p><p className="mt-1 text-2xl font-semibold">+ 28 <span className="text-sm font-normal text-[#75e5a3]">↗ 18%</span></p></div>
          </div>
        </div>
      </section>
      <section id="businesses" className="border-y border-[#dfe5da] bg-[#eef2ea] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">Для кого подходит</p><div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end"><h2 className="max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Любой бизнес, который ценит время клиентов</h2><p className="max-w-xs text-[#607068]">Гибко адаптируется к вашим услугам, специалистам и графику.</p></div><div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">{businesses.map((business, index) => <div key={business} className="group flex min-h-28 flex-col justify-between rounded-2xl bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#315343]/5"><span className="grid size-8 place-items-center rounded-xl bg-[#e7f8ed] text-sm font-bold text-[#337152]">0{index + 1}</span><span className="text-sm font-semibold">{business}</span></div>)}</div></div>
      </section>
      <section id="demo" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">Возможности</p><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Всё необходимое для уверенной работы с записью</h2></div><p className="max-w-sm text-[#607068]">Начните с простого — KARO Booking будет расти вместе с вашим бизнесом.</p></div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{benefits.map((benefit) => <article key={benefit.title} className="min-h-56 rounded-2xl border border-[#dfe5da] bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#619276]">{benefit.number}</span>{benefit.soon && <span className="rounded-full bg-[#fff2d7] px-2.5 py-1 text-xs font-semibold text-[#916420]">Скоро</span>}</div><div className="mt-20"><h3 className="text-lg font-semibold tracking-[-0.03em]">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-[#607068]">{benefit.description}</p></div></article>)}</div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#607068] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} KARO Booking</span><span>Онлайн-запись, которая работает для вас</span></footer>
    </main>
  );
}
