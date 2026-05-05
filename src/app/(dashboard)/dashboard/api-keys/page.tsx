/**
 * API Keys Management Page
 *
 * Dashboard page for managing API keys
 * Requires API_KEYS_READ permission
 */

import { ApiKeysTable } from '@/components/dashboard/api-keys/ApiKeysTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function ApiKeysPage() {
  // Require API_KEYS_READ permission to view this page
  await requirePermissionServer(Permission.API_KEYS_READ);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de API Keys</CardTitle>
          <CardDescription>
            Crea y administra las claves API para acceder a los servicios de forma programática.
            Estas claves permiten que sistemas externos (como n8n) puedan interactuar con la API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysTable />
        </CardContent>
      </Card>
    </div>
  )
}
