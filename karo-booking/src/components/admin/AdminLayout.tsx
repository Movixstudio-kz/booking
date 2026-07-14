import type { ReactNode } from "react";
import { Header } from "@/components/admin/Header";
import { Sidebar } from "@/components/admin/Sidebar";
import { CurrentUserProvider } from "@/hooks";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <CurrentUserProvider>
      <div className="min-h-screen bg-[#f9faf6] lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          {children}
        </div>
      </div>
    </CurrentUserProvider>
  );
}
