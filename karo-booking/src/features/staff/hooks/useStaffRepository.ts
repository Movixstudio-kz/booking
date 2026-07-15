"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultServices } from "@/features/services/data";
import type { ServiceItem } from "@/features/services/types";
import { defaultStaff } from "@/features/staff/data";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "@/features/staff/repositories";
import type { StaffItem } from "@/features/staff/types";
import { useCurrentUser } from "@/hooks";
import { createRepositoryContext, repositories } from "@/repositories";

export function useStaffRepository() {
  const { currentUser } = useCurrentUser();
  const context = useMemo(
    () => createRepositoryContext(currentUser),
    [currentUser],
  );
  const [staff, setStaff] = useState<StaffItem[]>(defaultStaff);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);
  const [repositoryError, setRepositoryError] = useState("");

  const refresh = useCallback(async () => {
    const [staffResult, servicesResult] = await Promise.all([
      repositories.staff.list(context),
      repositories.services.list(context),
    ]);

    if (staffResult.ok) setStaff(staffResult.data);
    if (servicesResult.ok) setServices(servicesResult.data);

    setRepositoryError(
      !staffResult.ok
        ? staffResult.error.message
        : !servicesResult.ok
          ? servicesResult.error.message
          : "",
    );
  }, [context]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refresh();
    });
    const unsubscribeStaff = repositories.staff.subscribe(() => {
      void refresh();
    });
    const unsubscribeServices = repositories.services.subscribe(() => {
      void refresh();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribeStaff();
      unsubscribeServices();
    };
  }, [refresh]);

  const createStaff = useCallback(
    async (input: CreateStaffInput) => {
      const result = await repositories.staff.create(context, input);
      if (result.ok) {
        setRepositoryError("");
        await refresh();
      } else {
        setRepositoryError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  const updateStaff = useCallback(
    async (id: string, input: UpdateStaffInput) => {
      const result = await repositories.staff.update(context, id, input);
      if (result.ok) {
        setRepositoryError("");
        await refresh();
      } else {
        setRepositoryError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  const archiveStaff = useCallback(
    async (id: string) => {
      const result = await repositories.staff.archive(context, id);
      if (result.ok) {
        setRepositoryError("");
        await refresh();
      } else {
        setRepositoryError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  return {
    currentUser,
    staff,
    services,
    repositoryError,
    refresh,
    createStaff,
    updateStaff,
    archiveStaff,
  };
}
