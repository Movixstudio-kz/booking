"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultServices } from "@/features/services/data";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "@/features/services/repositories";
import type { ServiceItem } from "@/features/services/types";
import { createRepositoryContext, repositories } from "@/repositories";
import type { CurrentUser } from "@/types/roles";

export function useServicesRepository(currentUser: CurrentUser) {
  const context = useMemo(
    () => createRepositoryContext(currentUser),
    [currentUser],
  );
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await repositories.services.list(context);
    if (result.ok) {
      setServices(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, [context]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refresh();
    });
    const unsubscribe = repositories.services.subscribe(() => {
      void refresh();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      unsubscribe();
    };
  }, [refresh]);

  const createService = useCallback(
    async (input: CreateServiceInput) => {
      const result = await repositories.services.create(context, input);
      if (result.ok) {
        setError(null);
        await refresh();
      } else {
        setError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  const updateService = useCallback(
    async (id: string, input: UpdateServiceInput) => {
      const result = await repositories.services.update(context, id, input);
      if (result.ok) {
        setError(null);
        await refresh();
      } else {
        setError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  const archiveService = useCallback(
    async (id: string) => {
      const result = await repositories.services.archive(context, id);
      if (result.ok) {
        setError(null);
        await refresh();
      } else {
        setError(result.error.message);
      }
      return result;
    },
    [context, refresh],
  );

  return {
    services,
    isLoading,
    error,
    refresh,
    createService,
    updateService,
    archiveService,
  };
}
