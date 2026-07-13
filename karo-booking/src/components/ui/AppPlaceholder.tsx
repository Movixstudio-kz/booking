import { Logo } from "@/components/ui/Logo";

type AppPlaceholderProps = { title: string; description: string };

export function AppPlaceholder({ title, description }: AppPlaceholderProps) {
  return <main className="grid min-h-screen place-items-center bg-[#f6f8f1] px-5"><div className="w-full max-w-lg rounded-[28px] border border-[#dfe5da] bg-white p-8 shadow-xl shadow-[#315343]/5 sm:p-10"><Logo /><div className="mt-12"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#619276]">KARO Booking</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-[#10231d]">{title}</h1><p className="mt-4 leading-7 text-[#607068]">{description}</p></div><p className="mt-10 inline-flex rounded-full bg-[#e8faef] px-3 py-1.5 text-sm font-semibold text-[#28734a]">В разработке</p></div></main>;
}
