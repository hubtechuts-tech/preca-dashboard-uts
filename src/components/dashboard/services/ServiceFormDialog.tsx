'use client'

/**
 * ServiceFormDialog Component
 *
 * Form dialog for creating/editing services (Spanish)
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Service {
  id: number
  code: string
  name: string
  description: string | null
  priceMxn: number
  targetPersonType: 'physical' | 'moral'
  isActive: boolean
  requiresApplicantDetails?: boolean  // NEW
}

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

interface FormData {
  code: string
  name: string
  description: string
  priceMxn: string
  targetPersonType: 'physical' | 'moral'
  isActive: boolean
  requiresApplicantDetails: boolean  // NEW
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!service

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      priceMxn: '',
      targetPersonType: 'physical',
      isActive: true,
      requiresApplicantDetails: false,  // NEW
    },
  })

  useEffect(() => {
    if (service) {
      reset({
        code: service.code,
        name: service.name,
        description: service.description || '',
        priceMxn: service.priceMxn.toString(),
        targetPersonType: service.targetPersonType,
        isActive: service.isActive,
        requiresApplicantDetails: service.requiresApplicantDetails || false,  // NEW
      })
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        priceMxn: '',
        targetPersonType: 'physical',
        isActive: true,
        requiresApplicantDetails: false,  // NEW
      })
    }
  }, [service, reset])

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setError(null)

      const payload = {
        code: data.code.toUpperCase(),
        name: data.name.trim(),
        description: data.description.trim() || null,
        priceMxn: parseFloat(data.priceMxn),
        targetPersonType: data.targetPersonType,
        isActive: data.isActive,
        requiresApplicantDetails: data.requiresApplicantDetails,  // NEW
      }

      const url = isEditing ? `/api/services/${service.id}` : '/api/services'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar el servicio')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información del servicio. Los cambios se sincronizan automáticamente con Stripe.'
              : 'Crea un nuevo servicio en el catálogo. Se creará automáticamente en Stripe.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Código <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="PRECA_BASIC"
              disabled={isEditing || loading}
              {...register('code', {
                required: 'El código es obligatorio',
                pattern: {
                  value: /^[A-Z0-9_]+$/,
                  message: 'El código debe ser en mayúsculas, alfanumérico con guiones bajos',
                },
              })}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            {!isEditing && (
              <p className="text-xs text-muted-foreground">
                El código no puede modificarse después de crearlo
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Precalificación Básica"
              disabled={loading}
              {...register('name', {
                required: 'El nombre es obligatorio',
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Verificación de identidad + Buró de Crédito básico"
              disabled={loading}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceMxn">
                Precio (MXN) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="priceMxn"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="299.00"
                disabled={loading}
                {...register('priceMxn', {
                  required: 'El precio es obligatorio',
                  min: {
                    value: 0.01,
                    message: 'El precio debe ser mayor a 0',
                  },
                })}
              />
              {errors.priceMxn && (
                <p className="text-sm text-destructive">{errors.priceMxn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPersonType">
                Tipo de Persona <span className="text-destructive">*</span>
              </Label>
              <select
                id="targetPersonType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isEditing || loading}
                {...register('targetPersonType', {
                  required: 'El tipo de persona es obligatorio',
                })}
              >
                <option value="physical">Persona Física</option>
                <option value="moral">Persona Moral</option>
              </select>
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  No puede modificarse después
                </p>
              )}
            </div>
          </div>

          {/* NEW: Requires Applicant Details Checkbox */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresApplicantDetails"
                className="h-4 w-4 rounded border-gray-300"
                disabled={loading}
                {...register('requiresApplicantDetails')}
              />
              <Label htmlFor="requiresApplicantDetails" className="cursor-pointer font-medium">
                Requiere detalles del solicitante
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Si está marcado, el formulario solicitará información adicional: tipo de persona (Física/Moral),
              RFC, domicilio completo y representante legal (solo PM). Estos campos son necesarios para
              generar la carta de autorización.
            </p>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300"
                disabled={loading}
                {...register('isActive')}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Servicio activo
              </Label>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
