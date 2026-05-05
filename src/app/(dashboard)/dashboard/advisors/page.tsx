/**
 * Advisors Management Page
 *
 * Dashboard page for managing real estate advisors
 * Requires ADVISORS_READ permission
 */

import { AdvisorsDashboard } from '@/components/dashboard/advisors/AdvisorsDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function AdvisorsPage() {
  // Require ADVISORS_READ permission to view this page
  await requirePermissionServer(Permission.ADVISORS_READ);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Asesores Inmobiliarios</h2>
          <p className="text-muted-foreground">
            Gestiona los asesores inmobiliarios que refieren clientes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Asesores</CardTitle>
          <CardDescription>
            Administra la información de los asesores inmobiliarios que trabajan con la plataforma.
            Los asesores pueden ser asociados con screenings para seguimiento de referencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdvisorsDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
