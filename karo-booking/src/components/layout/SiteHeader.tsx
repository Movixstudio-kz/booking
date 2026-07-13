import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-medium text-[#607068] md:flex">
        <a href="#businesses" className="transition hover:text-[#10231d]">Для бизнеса</a>
        <Link href="/booking" className="transition hover:text-[#10231d]">Запись</Link>
        <Link href="/admin" className="transition hover:text-[#10231d]">Войти</Link>
      </nav>
      <Link href="/booking" className="rounded-full bg-[#10231d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244137]">Начать</Link>
    </header>
  );
}
