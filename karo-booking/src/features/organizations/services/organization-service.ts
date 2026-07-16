import { createTimeSlots } from "@/features/booking/utils";
import type {
  Organization,
  PublicAvailabilitySlot,
  PublicOrganizationDirectory,
  PublicStaffProfile,
} from "@/features/organizations/types";
import type { ServiceItem } from "@/features/services/types";
import type { PublicStaffItem } from "@/features/staff/types";
import { publicBookingContext, repositories } from "@/repositories";
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "@/repositories/types";

const publicTimeSlots = createTimeSlots();

export function loadPublicOrganizations(): Promise<
  RepositoryResult<Organization[]>
> {
  return repositories.organizations.list(publicBookingContext);
}

export async function loadPublicOrganizationDirectory(
  organizationSlug: string,
): Promise<RepositoryResult<PublicOrganizationDirectory>> {
  const organizationResult = await repositories.organizations.getBySlug(
    publicBookingContext,
    organizationSlug,
  );
  if (!organizationResult.ok) return organizationResult;

  const [servicesResult, staffResult] = await Promise.all([
    repositories.services.list(publicBookingContext, {
      activeOnly: true,
      onlineBookingOnly: true,
    }),
    repositories.staff.listPublic(publicBookingContext),
  ]);
  if (!servicesResult.ok) return servicesResult;
  if (!staffResult.ok) return staffResult;

  return repositorySuccess({
    organization: organizationResult.data,
    services: servicesResult.data,
    staff: staffResult.data,
  });
}

export async function loadPublicStaffProfile(
  organizationSlug: string,
  staffSlug: string,
): Promise<RepositoryResult<PublicStaffProfile>> {
  const directoryResult = await loadPublicOrganizationDirectory(
    organizationSlug,
  );
  if (!directoryResult.ok) return directoryResult;

  const member = directoryResult.data.staff.find(
    (item) => item.publicSlug === staffSlug,
  );
  if (!member) {
    return repositoryFailure("not_found", "Мастер не найден.");
  }

  return repositorySuccess({
    ...directoryResult.data,
    member,
    memberServices: directoryResult.data.services.filter((service) =>
      member.serviceIds.includes(service.id),
    ),
  });
}

export async function loadNearestPublicStaffSlots(
  member: PublicStaffItem,
  services: readonly ServiceItem[],
  options: { days?: number; limit?: number; now?: Date } = {},
): Promise<RepositoryResult<PublicAvailabilitySlot[]>> {
  const service = services.reduce<ServiceItem | null>(
    (shortest, item) =>
      !shortest || item.durationMinutes < shortest.durationMinutes
        ? item
        : shortest,
    null,
  );
  if (!service) return repositorySuccess([]);

  const now = options.now ?? new Date();
  const days = options.days ?? 14;
  const limit = options.limit ?? 6;
  const available: PublicAvailabilitySlot[] = [];

  for (let dayOffset = 0; dayOffset < days && available.length < limit; dayOffset += 1) {
    const date = addDays(now, dayOffset);
    const result = await repositories.schedules.listAvailableSlots(
      publicBookingContext,
      {
        staffId: member.id,
        date,
        slots: publicTimeSlots,
        durationMinutes: service.durationMinutes,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
        now,
      },
    );
    if (!result.ok) return result;

    for (const time of result.data) {
      available.push({ date, time });
      if (available.length === limit) break;
    }
  }

  return repositorySuccess(available);
}

export async function getOrganizationStaticParams(): Promise<
  { organizationSlug: string }[]
> {
  const result = await loadPublicOrganizations();
  return result.ok
    ? result.data.map((organization) => ({
        organizationSlug: organization.slug,
      }))
    : [];
}

export async function getStaffStaticParams(): Promise<
  { organizationSlug: string; staffSlug: string }[]
> {
  const [organizationsResult, staffResult] = await Promise.all([
    loadPublicOrganizations(),
    repositories.staff.listPublic(publicBookingContext),
  ]);
  if (!organizationsResult.ok || !staffResult.ok) return [];

  return organizationsResult.data.flatMap((organization) =>
    staffResult.data.map((member) => ({
      organizationSlug: organization.slug,
      staffSlug: member.publicSlug,
    })),
  );
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + days);
  const offset = result.getTimezoneOffset();
  return new Date(result.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
