export function Header() {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#dfe5da] bg-[#f9faf6] px-5 py-4 sm:px-7">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f9187]">Компания</p><h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#10231d]">KARO Beauty Studio</h1></div>
      <div className="flex items-center gap-3"><label className="hidden items-center gap-2 rounded-xl border border-[#dfe5da] bg-white px-3 py-2 text-sm text-[#839087] sm:flex"><span aria-hidden="true">⌕</span><input aria-label="Поиск" className="w-36 bg-transparent outline-none placeholder:text-[#9ba8a0] lg:w-52" placeholder="Поиск" /></label><button type="button" aria-label="Уведомления" className="grid size-10 place-items-center rounded-xl border border-[#dfe5da] bg-white text-[#607068] transition hover:bg-[#f1f5ef]">♢</button><button type="button" className="flex items-center gap-2 rounded-xl bg-white py-1.5 pl-1.5 pr-3 text-left shadow-sm ring-1 ring-[#dfe5da]"><span className="grid size-7 place-items-center rounded-lg bg-[#c9f6d9] text-xs font-bold text-[#1d5b39]">БА</span><span className="hidden text-sm font-semibold text-[#24382f] sm:block">Батима</span></button></div>
    </header>
  );
}
