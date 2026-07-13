import Link from "next/link";
import { siteNavigation } from "@/config/navigation";
import { routes } from "@/config/routes";
import { Logo } from "@/components/ui/Logo";

export function SiteHeader() {
  return <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Logo /><nav className="hidden items-center gap-7 text-sm font-medium text-[#607068] md:flex">{siteNavigation.map((item) => item.href.startsWith("#") ? <a key={item.label} href={item.href} className="transition hover:text-[#10231d]">{item.label}</a> : <Link key={item.label} href={item.href} className="transition hover:text-[#10231d]">{item.label}</Link>)}</nav><Link href={routes.booking} className="rounded-full bg-[#10231d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244137]">Начать</Link></header>;
}
