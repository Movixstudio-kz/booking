"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, adminSettingsNavigation } from "@/config/navigation";
import { Logo } from "@/components/ui/Logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#dfe5da] bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-20 items-center px-5 lg:px-6"><Logo /></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:px-4">
        {adminNavigation.map((item) => <Link key={item.label} href={item.href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === item.href ? "bg-[#e7f8ed] text-[#17633c]" : "text-[#607068] hover:bg-[#f3f6f1] hover:text-[#10231d]"}`}><span className="grid size-5 place-items-center text-base leading-none">{item.icon}</span>{item.label}</Link>)}
      </nav>
      <div className="hidden mt-auto border-t border-[#edf0ea] p-4 lg:block"><Link href={adminSettingsNavigation.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#607068] transition hover:bg-[#f3f6f1] hover:text-[#10231d]"><span className="grid size-5 place-items-center text-base leading-none">{adminSettingsNavigation.icon}</span>{adminSettingsNavigation.label}</Link><div className="mt-5 rounded-2xl bg-[#10231d] p-4 text-white"><p className="text-xs text-white/60">KARO Booking</p><p className="mt-1 text-sm font-semibold">Ваш бизнес растёт</p><p className="mt-2 text-xs leading-5 text-white/65">Новые возможности уже скоро.</p></div></div>
    </aside>
  );
}
