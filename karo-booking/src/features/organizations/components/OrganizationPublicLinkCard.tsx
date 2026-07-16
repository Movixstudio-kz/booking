"use client";

import { getPublicOrganizationRoute } from "@/config/routes";
import { usePrimaryPublicOrganization } from "@/features/organizations/hooks";
import { PublicLinkActions } from "./PublicLinkActions";

export function OrganizationPublicLinkCard() {
  const organization = usePrimaryPublicOrganization();
  if (!organization) return null;

  return (
    <section className="mt-7 rounded-2xl border border-[#dfe5da] bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-[#619276]">Страница салона</p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#10231d]">
          {organization.name}
        </h3>
        <p className="mt-2 text-sm text-[#607068]">
          Ссылка для сайта, социальных сетей и мессенджеров.
        </p>
      </div>
      <div className="w-full sm:max-w-sm">
        <PublicLinkActions
          route={getPublicOrganizationRoute(organization.slug)}
          showOpen={false}
        />
      </div>
    </section>
  );
}
