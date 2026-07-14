import type { CurrentUser } from "@/types/roles";

export const CURRENT_USER_STORAGE_KEY = "karo-booking:current-user";

export type CurrentUserOption = {
  label: string;
  user: CurrentUser;
};

export const currentUserOptions: readonly CurrentUserOption[] = [
  {
    label: "Администратор",
    user: { id: "user-admin", name: "Администратор", role: "admin" },
  },
  {
    label: "Айгерим — сотрудник",
    user: {
      id: "user-staff-aigerim",
      name: "Айгерим",
      role: "staff",
      staffId: "aigerim",
    },
  },
  {
    label: "Дана — сотрудник",
    user: {
      id: "user-staff-dana",
      name: "Дана",
      role: "staff",
      staffId: "dana",
    },
  },
  {
    label: "Алия — сотрудник",
    user: {
      id: "user-staff-aliya",
      name: "Алия",
      role: "staff",
      staffId: "aliya",
    },
  },
  {
    label: "Просмотр",
    user: { id: "user-viewer", name: "Просмотр", role: "viewer" },
  },
];

export const defaultCurrentUser: CurrentUser = currentUserOptions[0].user;

export function findCurrentUser(userId: string): CurrentUser | undefined {
  return currentUserOptions.find(({ user }) => user.id === userId)?.user;
}
