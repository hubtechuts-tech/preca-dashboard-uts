'use client'

/**
 * ServicesTable Component
 *
 * Displays services in a table with CRUD actions (Spanish)
 */

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ServiceFormDialog } from './ServiceFormDialog'
import { DeleteServiceDialog } from './DeleteServiceDialog'
import { FormSchemaEditorDialog } from './FormSchemaEditorDialog'
import { useDialogOrigin } from '@/components/ui/animated-dialog'

interface Service {
  id: number
  code: string
  name: string
  description: string | null
  priceMxn: number
  formattedPrice: string
  targetPersonType: 'physical' | 'moral'
  stripeProductId: string | null
  stripePriceId: string | null
  isLinkedToStripe: boolean
  isActive: boolean
  formSchema: any | null
  hasFormSchema: boolean
  createdAt: string
  updatedAt: string
}

export function ServicesTable() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isFormSchemaOpen, setIsFormSchemaOpen] = useState(false)
  const [serviceForFormSchema, setServiceForFormSchema] = useState<Service | null>(null)
  const captureOrigin = useDialogOrigin()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/services')
      if (!response.ok) {
        throw new Error('Error al cargar los servicios')
      }
      const data = await response.json()
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedService(null)
    setIsFormOpen(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setIsFormOpen(true)
  }

  const handleDelete = (service: Service) => {
    setServiceToDelete(service)
    setIsDeleteOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedService(null)
    fetchServices()
  }

  const handleDeleteSuccess = () => {
    setIsDeleteOpen(false)
    setServiceToDelete(null)
    fetchServices()
  }

  const handleConfigureFormSchema = (service: Service) => {
    setServiceForFormSchema(service)
    setIsFormSchemaOpen(true)
  }

  const handleFormSchemaSuccess = () => {
    setIsFormSchemaOpen(false)
    setServiceForFormSchema(null)
    fetchServices()
  }

  const getPersonTypeLabel = (type: string) => {
    return type === 'physical' ? 'Persona Física' : 'Persona Moral'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-muted-foreground">Cargando servicios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {services.length} servicio{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={(e) => { captureOrigin(e); handleCreate(); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      <div className="rounded-md border">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Formulario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay servicios disponibles. Crea uno nuevo para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-sm">{service.code}</TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.description || <span className="text-muted-foreground italic">Sin descripción</span>}
                    </TableCell>
                    <TableCell className="font-semibold">{service.formattedPrice}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPersonTypeLabel(service.targetPersonType)}</Badge>
                    </TableCell>
                    <TableCell>
                      {service.isLinkedToStripe ? (
                        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                          <ExternalLink className="h-3 w-3" />
                          Vinculado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin vincular</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.hasFormSchema ? (
                        <Badge className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <FileText className="h-3 w-3" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin configurar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { captureOrigin(e); handleConfigureFormSchema(service); }}
                          title="Configurar formulario"
                        >
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { captureOrigin(e); handleEdit(service); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { captureOrigin(e); handleDelete(service); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {services.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               No hay servicios disponibles. Crea uno nuevo para comenzar.
             </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="bg-card p-5 rounded-xl border shadow-sm space-y-4">
                {/* Header & Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold truncate pr-2">{service.name}</h3>
                    {service.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 h-5 text-[10px] uppercase font-bold tracking-wider">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="px-2 h-5 text-[10px] uppercase font-bold tracking-wider">Inactivo</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-black text-foreground tracking-tight">
                    {service.formattedPrice}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                   <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wide">
                      <span>{service.code}</span>
                      <span className="text-border">|</span>
                      <span>{service.targetPersonType === 'physical' ? 'Física' : 'Moral'}</span>
                   </div>
                   <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description || "Sin descripción"}
                   </p>
                </div>

                {/* Integrations Badges */}
                <div className="flex flex-wrap gap-2">
                  {service.isLinkedToStripe && (
                    <Badge variant="outline" className="gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800/50">
                      <ExternalLink className="h-3 w-3" /> Stripe
                    </Badge>
                  )}
                  {service.hasFormSchema ? (
                    <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                      <FileText className="h-3 w-3" /> Form
                    </Badge>
                  ) : (
                     <Badge variant="outline" className="gap-1.5 border-dashed text-muted-foreground">
                        No Configurado
                     </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => { captureOrigin(e); handleEdit(service); }}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                    onClick={(e) => { captureOrigin(e); handleDelete(service); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ServiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={selectedService}
        onSuccess={handleFormSuccess}
      />

      <DeleteServiceDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        service={serviceToDelete}
        onSuccess={handleDeleteSuccess}
      />

      {serviceForFormSchema && (
        <FormSchemaEditorDialog
          open={isFormSchemaOpen}
          onOpenChange={setIsFormSchemaOpen}
          serviceId={serviceForFormSchema.id}
          serviceName={serviceForFormSchema.name}
          initialSchema={serviceForFormSchema.formSchema}
          onSuccess={handleFormSchemaSuccess}
        />
      )}
    </div>
  )
}
