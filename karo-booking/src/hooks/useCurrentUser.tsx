"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { defaultCurrentUser, findCurrentUser } from "@/config/currentUser";
import { loadCurrentUser, saveCurrentUser } from "@/services/current-user-storage";
import type { CurrentUser } from "@/types/roles";
import { useHydratedStorageState } from "./useHydratedStorageState";

type CurrentUserContextValue = {
  currentUser: CurrentUser;
  selectCurrentUser: (userId: string) => boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useHydratedStorageState(
    defaultCurrentUser,
    loadCurrentUser,
  );

  const selectCurrentUser = useCallback(
    (userId: string) => {
      const user = findCurrentUser(userId);
      if (!user || !saveCurrentUser(user)) {
        return false;
      }

      setCurrentUser(user);
      return true;
    },
    [setCurrentUser],
  );

  const value = useMemo(
    () => ({ currentUser, selectCurrentUser }),
    [currentUser, selectCurrentUser],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }

  return context;
}
