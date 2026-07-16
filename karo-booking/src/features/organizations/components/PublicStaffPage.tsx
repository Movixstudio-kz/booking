"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { getPublicOrganizationRoute } from "@/config/routes";
import { BookingFlow } from "@/features/booking/components";
import {
  loadNearestPublicStaffSlots,
  loadPublicStaffProfile,
} from "@/features/organizations/services";
import type {
  PublicAvailabilitySlot,
  PublicStaffProfile,
} from "@/features/organizations/types";
import { PublicNotFound } from "./PublicNotFound";
import { StaffPortrait } from "./StaffPortrait";

type PublicStaffPageProps = {
  organizationSlug: string;
  staffSlug: string;
  initialProfile: PublicStaffProfile | null;
};

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

function formatSlotDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function PublicStaffPage({
  organizationSlug,
  staffSlug,
  initialProfile,
}: PublicStaffPageProps) {
  const [profile, setProfile] = useState<PublicStaffProfile | null>(
    initialProfile,
  );
  const [nearestSlots, setNearestSlots] = useState<PublicAvailabilitySlot[]>([]);

  useEffect(() => {
    let active = true;
    const frameId = window.requestAnimationFrame(() => {
      void loadPublicStaffProfile(organizationSlug, staffSlug).then((result) => {
        if (!active) return;
        setProfile(result.ok ? result.data : null);
      });
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [organizationSlug, staffSlug]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    void loadNearestPublicStaffSlots(
      profile.member,
      profile.memberServices,
    ).then((result) => {
      if (active) setNearestSlots(result.ok ? result.data : []);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) {
    return (
      <PublicNotFound
        title="Мастер не найден"
        description="Проверьте ссылку или вернитесь на страницу салона."
      />
    );
  }

  const { organization, member, memberServices } = profile;

  return (
    <main className="min-h-screen bg-[#f6f8f1]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link
          href={getPublicOrganizationRoute(organization.slug)}
          className="text-sm font-semibold text-[#607068] transition hover:text-[#10231d]"
        >
          ← {organization.name}
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-9 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[420px_1fr] lg:items-center lg:pt-14">
        <StaffPortrait
          member={member}
          className="aspect-[4/4.4] w-full rounded-[32px] object-cover shadow-2xl shadow-[#315343]/10"
        />
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">
            {organization.name} · мастер
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.065em] text-[#10231d] sm:text-6xl">
            {member.name}
          </h1>
          <p className="mt-4 text-lg font-semibold text-[#385145]">
            {member.position}
          </p>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#607068]">
            {member.description}
          </p>
          <a
            href="#booking"
            className="mt-8 inline-flex rounded-full bg-[#10231d] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#10231d]/10 transition hover:-translate-y-0.5 hover:bg-[#244137]"
          >
            Записаться к этому мастеру
          </a>
        </div>
      </section>

      <section className="border-y border-[#dfe5da] bg-[#eef2ea] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">
              Услуги мастера
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {memberServices.map((service) => (
                <article key={service.id} className="rounded-2xl bg-white p-5">
                  <h2 className="font-semibold text-[#10231d]">{service.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#607068]">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <span className="text-sm text-[#718178]">
                      {service.durationMinutes} минут
                    </span>
                    <span className="font-semibold text-[#294739]">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] bg-[#10231d] p-6 text-white">
            <p className="text-sm font-semibold text-[#75e5a3]">
              Ближайшие свободные окна
            </p>
            {nearestSlots.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {nearestSlots.map((slot) => (
                  <a
                    key={`${slot.date}-${slot.time}`}
                    href="#booking"
                    className="rounded-xl bg-white/8 p-3 transition hover:bg-white/14"
                  >
                    <span className="block text-xs text-white/60">
                      {formatSlotDate(slot.date)}
                    </span>
                    <span className="mt-1 block font-semibold">{slot.time}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-white/65">
                Выберите услугу и дату ниже, чтобы увидеть актуальные окна.
              </p>
            )}
          </aside>
        </div>
      </section>

      <section id="booking" aria-label={`Запись к мастеру ${member.name}`}>
        <BookingFlow
          embedded
          organizationSlug={organization.slug}
          lockedStaffSlug={member.publicSlug}
        />
      </section>
    </main>
  );
}
