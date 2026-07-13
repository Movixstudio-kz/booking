import Link from "next/link";
import { routes } from "@/config/routes";

type LogoProps = { inverse?: boolean };

export function Logo({ inverse = false }: LogoProps) {
  return <Link href={routes.home} className={`inline-flex items-center gap-2 font-semibold tracking-[-0.04em] ${inverse ? "text-white" : "text-[#10231d]"}`}><span className="grid size-8 place-items-center rounded-[11px] bg-[#3ee58c] text-sm font-black text-[#10231d]">K</span><span className="text-lg">KARO <span className={inverse ? "text-white/65" : "text-[#607068]"}>Booking</span></span></Link>;
}
