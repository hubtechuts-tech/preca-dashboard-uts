/**
 * Screenings Dashboard Page
 *
 * View and manage all screening requests
 * Requires SCREENINGS_READ permission
 */

import { ScreeningsDashboard } from '@/components/dashboard/screenings/ScreeningsDashboard'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function ScreeningsPage() {
  // Require SCREENINGS_READ permission to view this page
  await requirePermissionServer(Permission.SCREENINGS_READ);

  return <ScreeningsDashboard />
}
