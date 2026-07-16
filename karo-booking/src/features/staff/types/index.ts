export type StaffItem = {
  id: string;
  name: string;
  position: string;
  phone: string;
  calendarColor: string;
  isActive: boolean;
  serviceIds: string[];
  publicSlug: string;
  photoUrl: string;
  description: string;
};

export type PublicStaffItem = Pick<
  StaffItem,
  | "id"
  | "name"
  | "position"
  | "calendarColor"
  | "isActive"
  | "serviceIds"
  | "publicSlug"
  | "photoUrl"
  | "description"
>;
