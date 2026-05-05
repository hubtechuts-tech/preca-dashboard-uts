/**
 * Clients Dashboard Page
 *
 * Modern, interactive view of all clients with stats
 * Requires CLIENTS_READ permission
 */

import { ClientsDashboard } from '@/components/dashboard/clients/ClientsDashboard'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function ClientsPage() {
  // Require CLIENTS_READ permission to view this page
  await requirePermissionServer(Permission.CLIENTS_READ);

  return <ClientsDashboard />
}
