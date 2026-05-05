"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-provider";
import { PageTransition } from "./page-transition";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        <div className="container mx-auto p-4 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

export function DashboardWrapper({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
