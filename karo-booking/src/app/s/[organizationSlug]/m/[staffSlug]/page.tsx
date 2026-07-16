import { PublicStaffPage } from "@/features/organizations/components";
import {
  getStaffStaticParams,
  loadPublicStaffProfile,
} from "@/features/organizations/services";

type PublicStaffRoutePageProps = {
  params: Promise<{ organizationSlug: string; staffSlug: string }>;
};

export function generateStaticParams() {
  return getStaffStaticParams();
}

export default async function PublicStaffRoutePage({
  params,
}: PublicStaffRoutePageProps) {
  const { organizationSlug, staffSlug } = await params;
  const result = await loadPublicStaffProfile(organizationSlug, staffSlug);

  return (
    <PublicStaffPage
      organizationSlug={organizationSlug}
      staffSlug={staffSlug}
      initialProfile={result.ok ? result.data : null}
    />
  );
}
