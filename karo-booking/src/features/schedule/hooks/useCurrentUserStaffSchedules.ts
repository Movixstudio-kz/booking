"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/hooks";
import { createRepositoryContext } from "@/repositories";
import { useStaffSchedules } from "./useStaffSchedules";

export function useCurrentUserStaffSchedules() {
  const { currentUser } = useCurrentUser();
  const context = useMemo(
    () => createRepositoryContext(currentUser),
    [currentUser],
  );
  return useStaffSchedules(context);
}
