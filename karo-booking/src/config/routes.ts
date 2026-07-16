export const routes = {
  home: "/",
  admin: "/admin",
  booking: "/booking",
  appointments: "/appointments",
  calendar: "/calendar",
  clients: "/clients",
  staff: "/staff",
  services: "/services",
  settings: "#settings",
} as const;

export type RouteKey = keyof typeof routes;
export type AppRoute = (typeof routes)[RouteKey];

export const publicBasePath = "/booking";

export function getPublicOrganizationRoute(organizationSlug: string): string {
  return `/s/${organizationSlug}`;
}

export function getPublicStaffRoute(
  organizationSlug: string,
  staffSlug: string,
): string {
  return `${getPublicOrganizationRoute(organizationSlug)}/m/${staffSlug}`;
}

export function getAbsolutePublicUrl(origin: string, route: string): string {
  const path = `${publicBasePath}${route}/`.replace(/\/{2,}/g, "/");
  return new URL(path, origin).toString();
}

export function getPublicAssetPath(assetPath: string): string {
  if (!assetPath) return "";
  return `${publicBasePath}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
