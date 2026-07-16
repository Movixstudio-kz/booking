"use client";

import { useEffect, useState } from "react";
import { loadPublicOrganizations } from "@/features/organizations/services";
import type { Organization } from "@/features/organizations/types";

export function usePrimaryPublicOrganization(): Organization | null {
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    let active = true;
    const frameId = window.requestAnimationFrame(() => {
      void loadPublicOrganizations().then((result) => {
        if (active && result.ok) setOrganization(result.data[0] ?? null);
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return organization;
}
