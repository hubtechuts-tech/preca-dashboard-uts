import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify user session - redirect to login if not authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    await verifySession(token);
  } catch (error) {
    redirect("/login");
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}
