/**
 * Coupons Management Page
 *
 * Dashboard page for managing discount coupons
 * Requires COUPONS_READ permission
 */

import { CouponsDashboard } from '@/components/dashboard/coupons/CouponsDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermissionServer } from '@/lib/permissions'
import { Permission } from '@/domain/entities/Permission'

export default async function CouponsPage() {
  // Require COUPONS_READ permission to view this page
  await requirePermissionServer(Permission.COUPONS_READ);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cupones de Descuento</h2>
          <p className="text-muted-foreground">
            Gestiona cupones para organizaciones y promociones especiales
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cupones</CardTitle>
          <CardDescription>
            Crea y administra cupones de descuento que se sincronizan con Stripe. Los cupones pueden aplicarse a servicios específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponsDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
