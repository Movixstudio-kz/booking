"use client";

import { useCallback, useEffect } from "react";
import { useHydratedStorageState } from "@/hooks";
import { createDefaultStaffSchedule, defaultStaffSchedules } from "@/features/schedule/data";
import {
  loadStaffSchedules,
  saveStaffSchedule,
  STAFF_SCHEDULES_CHANGED_EVENT,
} from "@/features/schedule/services";
import type { StaffSchedule } from "@/features/schedule/types";

export function useStaffSchedules() {
  const [schedules, setSchedules] = useHydratedStorageState<StaffSchedule[]>(defaultStaffSchedules, loadStaffSchedules);

  useEffect(() => {
    function refreshSchedules() {
      setSchedules(loadStaffSchedules());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === "karo-booking:staff-schedules") refreshSchedules();
    }

    window.addEventListener(STAFF_SCHEDULES_CHANGED_EVENT, refreshSchedules);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(STAFF_SCHEDULES_CHANGED_EVENT, refreshSchedules);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setSchedules]);

  const getSchedule = useCallback(
    (staffId: string) => schedules.find((schedule) => schedule.staffId === staffId) ?? createDefaultStaffSchedule(staffId),
    [schedules],
  );

  const updateSchedule = useCallback((schedule: StaffSchedule): boolean => {
    if (!saveStaffSchedule(schedule)) return false;
    setSchedules((current) => {
      const exists = current.some((item) => item.staffId === schedule.staffId);
      return exists
        ? current.map((item) => item.staffId === schedule.staffId ? schedule : item)
        : [...current, schedule];
    });
    return true;
  }, [setSchedules]);

  return { schedules, getSchedule, updateSchedule };
}
