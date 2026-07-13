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
