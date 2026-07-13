import type { ReactNode } from "react";
import { Header } from "@/components/admin/Header";
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f9faf6] lg:flex"><Sidebar /><div className="min-w-0 flex-1"><Header />{children}</div></div>;
}
