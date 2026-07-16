import type { ServiceItem } from "@/features/services/types";
import type { PublicStaffItem } from "@/features/staff/types";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  logoUrl: string;
  description: string;
  primaryColor: string;
  active: boolean;
};

export type PublicOrganizationDirectory = {
  organization: Organization;
  services: ServiceItem[];
  staff: PublicStaffItem[];
};

export type PublicStaffProfile = PublicOrganizationDirectory & {
  member: PublicStaffItem;
  memberServices: ServiceItem[];
};

export type PublicAvailabilitySlot = {
  date: string;
  time: string;
};
