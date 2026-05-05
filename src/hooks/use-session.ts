"use client";

import { useEffect, useState } from "react";
import { Permission } from "@/domain/entities/Permission";

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  permissions: Permission[];
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!session) return false;
    if (session.role === "admin") return true; // Admins have all permissions
    return session.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!session) return false;
    if (session.role === "admin") return true;
    return permissions.some((p) => session.permissions?.includes(p));
  };

  const isAdmin = (): boolean => {
    return session?.role === "admin";
  };

  return {
    session,
    loading,
    hasPermission,
    hasAnyPermission,
    isAdmin,
  };
}
