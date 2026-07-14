export type UserRole = "admin" | "staff" | "viewer";

export type CurrentUser = {
  id: string;
  name: string;
  role: UserRole;
  staffId?: string;
};
