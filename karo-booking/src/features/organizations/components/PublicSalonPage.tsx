"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import {
  getPublicAssetPath,
  getPublicStaffRoute,
  routes,
} from "@/config/routes";
import { loadPublicOrganizationDirectory } from "@/features/organizations/services";
import type { PublicOrganizationDirectory } from "@/features/organizations/types";
import { PublicNotFound } from "./PublicNotFound";
import { StaffPortrait } from "./StaffPortrait";

type PublicSalonPageProps = {
  organizationSlug: string;
  initialDirectory: PublicOrganizationDirectory | null;
};

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("ru-KZ").format(price)} ₸`;

export function PublicSalonPage({
  organizationSlug,
  initialDirectory,
}: PublicSalonPageProps) {
  const [directory, setDirectory] =
    useState<PublicOrganizationDirectory | null>(initialDirectory);

  useEffect(() => {
    let active = true;
    const frameId = window.requestAnimationFrame(() => {
      void loadPublicOrganizationDirectory(organizationSlug).then((result) => {
        if (active) setDirectory(result.ok ? result.data : null);
      });
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [organizationSlug]);

  if (!directory) return <PublicNotFound />;

  const { organization, services, staff } = directory;
  const whatsappNumber = organization.phone.replace(/\D/g, "");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f1]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link
          href={routes.home}
          className="text-sm font-semibold text-[#607068] transition hover:text-[#10231d]"
        >
          KARO Booking
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:grid-cols-[1fr_420px] lg:items-center lg:pt-14">
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#d7ded2] bg-white/80 px-3.5 py-2 text-sm font-medium text-[#466056]">
            <span className="size-2 rounded-full bg-[#3ee58c]" />
            {organization.city} · онлайн-запись открыта
          </p>
          <h1 className="mt-7 text-5xl font-semibold tracking-[-0.065em] text-[#10231d] sm:text-6xl">
            {organization.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#607068]">
            {organization.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={routes.booking}
              className="rounded-full bg-[#10231d] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#10231d]/10 transition hover:-translate-y-0.5 hover:bg-[#244137]"
            >
              Записаться
            </Link>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#cfd8cf] bg-white px-5 py-3.5 text-sm font-semibold text-[#486055] transition hover:border-[#9faea2]"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#b7f6d0] blur-3xl" />
          <div className="relative rounded-[32px] border border-white/80 bg-white p-7 shadow-2xl shadow-[#315343]/10">
            <Image
              src={getPublicAssetPath(organization.logoUrl)}
              alt={`Логотип ${organization.name}`}
              width={104}
              height={104}
              unoptimized
              className="size-24 rounded-[28px]"
            />
            <p className="mt-7 text-sm font-semibold text-[#10231d]">
              {organization.address}
            </p>
            <p className="mt-2 text-sm text-[#607068]">{organization.city}</p>
            <a
              href={`tel:${organization.phone.replace(/\s/g, "")}`}
              className="mt-5 block text-lg font-semibold text-[#237347]"
            >
              {organization.phone}
            </a>
            <a
              href={`mailto:${organization.email}`}
              className="mt-2 block text-sm text-[#607068]"
            >
              {organization.email}
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe5da] bg-[#eef2ea] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">
            Услуги
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Выберите подходящий уход
          </h2>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-2xl bg-white p-5 shadow-sm shadow-[#315343]/5"
              >
                <h3 className="font-semibold text-[#10231d]">{service.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#607068]">
                  {service.description}
                </p>
                <div className="mt-6 flex items-end justify-between gap-3">
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
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#619276]">
          Команда
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          Мастера KARO Beauty
        </h2>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {staff.map((member) => (
            <Link
              key={member.id}
              href={getPublicStaffRoute(organization.slug, member.publicSlug)}
              className="group overflow-hidden rounded-[28px] border border-[#dfe5da] bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#315343]/8"
            >
              <StaffPortrait
                member={member}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10231d]">
                  {member.name}
                </h3>
                <p className="mt-2 text-sm text-[#607068]">{member.position}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[#237347]">
                  Открыть страницу →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
