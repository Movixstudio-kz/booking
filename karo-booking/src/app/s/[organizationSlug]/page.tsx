import { PublicSalonPage } from "@/features/organizations/components";
import {
  getOrganizationStaticParams,
  loadPublicOrganizationDirectory,
} from "@/features/organizations/services";

type PublicOrganizationPageProps = {
  params: Promise<{ organizationSlug: string }>;
};

export function generateStaticParams() {
  return getOrganizationStaticParams();
}

export default async function PublicOrganizationPage({
  params,
}: PublicOrganizationPageProps) {
  const { organizationSlug } = await params;
  const result = await loadPublicOrganizationDirectory(organizationSlug);

  return (
    <PublicSalonPage
      organizationSlug={organizationSlug}
      initialDirectory={result.ok ? result.data : null}
    />
  );
}
