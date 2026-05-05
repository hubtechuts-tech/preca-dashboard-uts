"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FileCheck,
  Users,
  Settings,
  X,
  Building2,
  Key,
  ClipboardList,
  UserCog,
  Ticket,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useSidebar } from "@/components/dashboard/sidebar-provider";
import { useSession } from "@/hooks/use-session";
import { Permission } from "@/domain/entities/Permission";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: NavItem[];
  requiredPermissions?: Permission[]; // If undefined, always show (like Home)
  adminOnly?: boolean; // Only admins can see
}

const navItems: NavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Servicios",
    href: "/dashboard/services",
    icon: FileCheck,
    requiredPermissions: [Permission.SERVICES_READ],
  },
  {
    title: "Cupones",
    href: "/dashboard/coupons",
    icon: Ticket,
    requiredPermissions: [Permission.COUPONS_READ],
  },
  {
    title: "Asesores",
    href: "/dashboard/advisors",
    icon: UserCheck,
    requiredPermissions: [Permission.ADVISORS_READ],
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
    requiredPermissions: [Permission.API_KEYS_READ],
  },
  {
    title: "Solicitudes",
    href: "/dashboard/screenings",
    icon: ClipboardList,
    requiredPermissions: [Permission.SCREENINGS_READ],
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    requiredPermissions: [Permission.CLIENTS_READ],
  },
  {
    title: "Personal",
    href: "/dashboard/staff",
    icon: UserCog,
    adminOnly: true, // Only admins can manage staff
  },
  {
    title: "Configuración",
    href: "/dashboard/configuration",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const { session, hasAnyPermission, isAdmin } = useSession();

  const isActive = (href: string) => pathname === href;

  const canViewItem = (item: NavItem): boolean => {
    // If admin only, check if user is admin
    if (item.adminOnly) {
      return isAdmin();
    }

    // If no permissions required, everyone can see it
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has any of the required permissions
    return hasAnyPermission(item.requiredPermissions);
  };

  const visibleNavItems = navItems.filter(canViewItem);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen border-r",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0",
          "lg:translate-x-0",
          isOpen ? "w-72" : "w-0"
        )}
        style={{
          backgroundColor: "var(--color-sidebar)",
          color: "var(--color-sidebar-foreground)",
          borderColor: "var(--color-sidebar-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--color-sidebar-border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">PRECA</h2>
              <p className="text-xs opacity-60">Sistema de Gestión</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0"
              style={{
                ["--hover-bg" as string]: "var(--color-sidebar-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-sidebar-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 py-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
                )}
                style={{
                  backgroundColor: isActive(item.href)
                    ? "var(--color-sidebar-accent)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "var(--color-sidebar-accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "var(--color-sidebar-border)" }}>
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: "var(--color-sidebar-accent)" }}
          >
            <p className="text-xs font-medium mb-1">Contacto</p>
            <p className="text-xs opacity-70">+52 961 316 8341</p>
            <p className="text-xs opacity-70 truncate select-all">atencionaclientes@rentasok.com</p>
          </div>
        </div>
      </aside>

      {/* Toggle Button - Visible when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-all duration-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </>
  );
}
