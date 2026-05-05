/**
 * Services Management Page (Spanish)
 *
 * Dashboard page for managing service catalog
 * Requires SERVICES_READ permission
 */

import { ServicesTable } from '@/components/dashboard/services/ServicesTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function ServicesPage() {
  // Require SERVICES_READ permission to view this page
  await requirePermissionServer(Permission.SERVICES_READ);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Servicios</CardTitle>
          <CardDescription>
            Administra los servicios de precalificación disponibles. Todos los cambios se sincronizan automáticamente con Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicesTable />
        </CardContent>
      </Card>
    </div>
  )
}
