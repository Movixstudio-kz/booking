import { CurrentUserSwitcher } from "@/components/admin/CurrentUserSwitcher";

export function Header() {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#dfe5da] bg-[#f9faf6] px-5 py-4 sm:px-7">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f9187]">Компания</p><h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#10231d]">KARO Beauty Studio</h1></div>
      <div className="flex items-center gap-3"><label className="hidden items-center gap-2 rounded-xl border border-[#dfe5da] bg-white px-3 py-2 text-sm text-[#839087] sm:flex"><span aria-hidden="true">⌕</span><input aria-label="Поиск" className="w-36 bg-transparent outline-none placeholder:text-[#9ba8a0] lg:w-52" placeholder="Поиск" /></label><CurrentUserSwitcher /></div>
    </header>
  );
}
