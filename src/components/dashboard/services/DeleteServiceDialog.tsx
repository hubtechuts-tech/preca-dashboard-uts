'use client'

/**
 * DeleteServiceDialog Component
 *
 * Confirmation dialog for deleting services (Spanish)
 */

import { useState } from 'react'
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface Service {
  id: number
  code: string
  name: string
}

interface DeleteServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: DeleteServiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!service) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el servicio')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Servicio
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El servicio será eliminado del catálogo y desactivado en Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-1">
              Servicio a eliminar:
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{service.code}</span> - {service.name}
            </p>
          </div>

          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-700 p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Nota:</strong> Si existen evaluaciones asociadas a este servicio, la eliminación podría fallar.
              Considera desactivar el servicio en lugar de eliminarlo.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar Servicio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
