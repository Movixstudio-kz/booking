import type { Organization } from "@/features/organizations/types";
import { DEFAULT_ORGANIZATION_ID } from "@/repositories/tenant-context";

export const defaultOrganizations: Organization[] = [
  {
    id: DEFAULT_ORGANIZATION_ID,
    name: "KARO Beauty",
    slug: "karo-beauty",
    phone: "+7 700 555 25 25",
    email: "hello@karobeauty.kz",
    city: "Алматы",
    address: "ул. Абая, 25",
    logoUrl: "/brand/karo-beauty.svg",
    description:
      "Современное пространство красоты, где забота о себе легко вписывается в ваш график.",
    primaryColor: "#3ee58c",
    active: true,
  },
];
