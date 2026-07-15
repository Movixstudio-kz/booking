"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingRecord } from "@/features/booking/types";
import { useCurrentUser } from "@/hooks";
import { createRepositoryContext, repositories } from "@/repositories";
import type { RepositoryResult } from "@/repositories/types";

export function useAppointmentsRepository() {
  const { currentUser } = useCurrentUser();
  const context = useMemo(
    () => createRepositoryContext(currentUser),
    [currentUser],
  );
  const [appointments, setAppointments] = useState<BookingRecord[]>([]);
  const [repositoryError, setRepositoryError] = useState("");

  const refresh = useCallback(async (): Promise<RepositoryResult<BookingRecord[]>> => {
    const result = await repositories.appointments.list(context);
    if (result.ok) {
      setAppointments(result.data);
      setRepositoryError("");
    } else {
      setRepositoryError(result.error.message);
    }
    return result;
  }, [context]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refresh();
    });
    const unsubscribe = repositories.appointments.subscribe(() => {
      void refresh();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribe();
    };
  }, [refresh]);

  return {
    currentUser,
    context,
    appointments,
    setAppointments,
    repositoryError,
    refresh,
  };
}
