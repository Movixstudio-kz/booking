"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createDefaultStaffSchedule, defaultStaffSchedules } from "@/features/schedule/data";
import type { StaffSchedule } from "@/features/schedule/types";
import { repositories } from "@/repositories";
import type { RepositoryContext } from "@/repositories/types";

export function useStaffSchedules(context: RepositoryContext) {
  const stableContext = useMemo<RepositoryContext>(
    () => ({ ...context }),
    [context],
  );
  const [schedules, setSchedules] = useState<StaffSchedule[]>(defaultStaffSchedules);
  const [repositoryError, setRepositoryError] = useState("");

  const refresh = useCallback(async () => {
    const result = await repositories.schedules.list(stableContext);
    if (result.ok) {
      setSchedules(result.data);
      setRepositoryError("");
    } else {
      setRepositoryError(result.error.message);
    }
    return result;
  }, [stableContext]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refresh();
    });
    const unsubscribe = repositories.schedules.subscribe(() => {
      void refresh();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribe();
    };
  }, [refresh]);

  const getSchedule = useCallback(
    (staffId: string) => schedules.find((schedule) => schedule.staffId === staffId) ?? createDefaultStaffSchedule(staffId),
    [schedules],
  );

  const updateSchedule = useCallback(async (schedule: StaffSchedule): Promise<boolean> => {
    const result = await repositories.schedules.save(stableContext, schedule.staffId, schedule);
    if (!result.ok) {
      setRepositoryError(result.error.message);
      return false;
    }
    setSchedules((current) => {
      const exists = current.some((item) => item.staffId === schedule.staffId);
      return exists
        ? current.map((item) => item.staffId === schedule.staffId ? result.data : item)
        : [...current, result.data];
    });
    setRepositoryError("");
    return true;
  }, [stableContext]);

  return { schedules, getSchedule, updateSchedule, repositoryError, refresh };
}
