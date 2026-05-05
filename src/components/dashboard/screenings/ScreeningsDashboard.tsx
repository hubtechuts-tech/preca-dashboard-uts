'use client'

/**
 * Screenings Dashboard Component
 *
 * Main component for managing screenings with filters and table view
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface Screening {
  id: string
  applicantName: string
  applicantEmail: string
  status: string
  createdAt: string
  paymentAmount: number | null
  serviceId: number
}

export function ScreeningsDashboard() {
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchScreenings()
  }, [statusFilter])

  const fetchScreenings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/screenings?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar las solicitudes')

      const data = await response.json()
      setScreenings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending_payment: 'outline',
      paid: 'secondary',
      processing_bureau: 'default',
      completed: 'default',
      rejected: 'destructive',
    }

    const labels: Record<string, string> = {
      pending_payment: 'Pendiente de Pago',
      paid: 'Pagado',
      processing_bureau: 'Procesando',
      completed: 'Completado',
      rejected: 'Rechazado',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
          <p className="text-muted-foreground">
            Ver y administrar todas las solicitudes
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/screenings/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Button
            variant={statusFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === 'pending_payment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending_payment')}
            className="whitespace-nowrap"
          >
            Pendiente de Pago
          </Button>
          <Button
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('paid')}
            className="whitespace-nowrap"
          >
            Pagado
          </Button>
          <Button
            variant={statusFilter === 'processing_bureau' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('processing_bureau')}
            className="whitespace-nowrap"
          >
            Procesando
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
            className="whitespace-nowrap"
          >
            Completado
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Table */}
      <Card>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Cargando solicitudes...
                  </TableCell>
                </TableRow>
              ) : screenings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No se encontraron solicitudes
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {screenings.map((screening) => (
                    <motion.tr
                      key={screening.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-medium">
                        {screening.applicantName}
                      </TableCell>
                      <TableCell>{screening.applicantEmail}</TableCell>
                      <TableCell>{getStatusBadge(screening.status)}</TableCell>
                      <TableCell>{formatCurrency(screening.paymentAmount)}</TableCell>
                      <TableCell>{formatDate(screening.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/screenings/${screening.id}`}>Ver</a>
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4 bg-muted/20">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : screenings.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No se encontraron solicitudes</div>
          ) : (
            <AnimatePresence>
              {screenings.map((screening) => (
                <motion.div
                  key={screening.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card p-4 rounded-lg border shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-base">{screening.applicantName}</p>
                      <p className="text-sm text-muted-foreground">{screening.applicantEmail}</p>
                    </div>
                    {getStatusBadge(screening.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm py-2 border-t border-dashed">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span>{formatDate(screening.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm pb-2 border-b border-dashed">
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-medium">{formatCurrency(screening.paymentAmount)}</span>
                  </div>

                  <Button variant="default" size="sm" className="w-full mt-2" asChild>
                    <a href={`/dashboard/screenings/${screening.id}`}>Ver Detalles</a>
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>
    </div>
  )
}
