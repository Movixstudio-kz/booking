import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/config/routes";

type PublicNotFoundProps = {
  title?: string;
  description?: string;
};

export function PublicNotFound({
  title = "Салон не найден",
  description = "Проверьте адрес страницы или вернитесь на главную KARO Booking.",
}: PublicNotFoundProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f1] px-5 py-12">
      <section className="w-full max-w-xl rounded-[32px] border border-[#dfe5da] bg-white p-7 text-center shadow-2xl shadow-[#315343]/8 sm:p-12">
        <Logo />
        <div className="mx-auto mt-10 grid size-16 place-items-center rounded-3xl bg-[#e8faef] text-2xl font-black text-[#237347]">
          ?
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-[#10231d]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-[#607068]">
          {description}
        </p>
        <Link
          href={routes.home}
          className="mt-8 inline-flex rounded-full bg-[#10231d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244137]"
        >
          На главную
        </Link>
      </section>
    </main>
  );
}
