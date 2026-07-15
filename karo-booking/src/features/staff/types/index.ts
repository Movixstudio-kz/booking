export type StaffItem = {
  id: string;
  name: string;
  position: string;
  phone: string;
  calendarColor: string;
  isActive: boolean;
  serviceIds: string[];
};

export type PublicStaffItem = Pick<
  StaffItem,
  "id" | "name" | "position" | "calendarColor" | "isActive" | "serviceIds"
>;
