'use client'

/**
 * Dashboard Overview Component
 *
 * Main dashboard with statistics, recent activity, and quick actions
 * Focus on excellent UX with clear data visualization
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  total: number
  pendingPayment: number
  paid: number
  processing: number
  completed: number
  totalRevenue: number
}

interface RecentScreening {
  id: string
  applicantName: string
  status: string
  createdAt: string
  paymentAmount: number | null
}

// Main Dashboard Component
export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentScreenings, setRecentScreenings] = useState<RecentScreening[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all screenings
      const response = await fetch('/api/screenings')
      if (!response.ok) throw new Error('Error al cargar los datos')

      const screenings = await response.json()

      // Calculate statistics
      const stats: DashboardStats = {
        total: screenings.length,
        pendingPayment: screenings.filter((s: any) => s.status === 'pending_payment').length,
        paid: screenings.filter((s: any) => s.status === 'paid').length,
        processing: screenings.filter((s: any) => s.status === 'processing_bureau').length,
        completed: screenings.filter((s: any) => s.status === 'completed').length,
        totalRevenue: screenings
          .filter((s: any) => s.paymentAmount)
          .reduce((sum: number, s: any) => sum + s.paymentAmount, 0)
      }

      setStats(stats)

      // Get recent screenings (last 5)
      const recent = screenings
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      setRecentScreenings(recent)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending_payment: { label: 'Pendiente', variant: 'outline' },
      paid: { label: 'Pagado', variant: 'secondary' },
      processing_bureau: { label: 'Procesando', variant: 'default' },
      completed: { label: 'Completado', variant: 'default' },
      rejected: { label: 'Rechazado', variant: 'destructive' }
    }
    return configs[status] || configs.pending_payment
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Solicitudes',
      value: stats.total,
      icon: FileText,
      description: 'Todas las solicitudes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pendientes de Pago',
      value: stats.pendingPayment,
      icon: Clock,
      description: 'Esperando pago',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'En Proceso',
      value: stats.processing,
      icon: Users,
      description: 'Verificación en curso',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Completadas',
      value: stats.completed,
      icon: CheckCircle2,
      description: 'Reportes enviados',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">
          Visión general del sistema de gestión PRECA
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Ingresos Totales
              </CardTitle>
              <CardDescription>Pagos completados</CardDescription>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.paid + stats.processing + stats.completed} solicitudes pagadas
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Screenings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solicitudes Recientes</CardTitle>
                  <CardDescription>Últimas 5 solicitudes</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/screenings">
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentScreenings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay solicitudes aún</p>
                  <p className="text-sm mt-1">
                    Las solicitudes aparecerán aquí cuando se creen
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScreenings.map((screening) => {
                    const statusConfig = getStatusConfig(screening.status)
                    return (
                      <Link
                        key={screening.id}
                        href={`/dashboard/screenings/${screening.id}`}
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {screening.applicantName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(screening.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {screening.paymentAmount && (
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(screening.paymentAmount)}
                              </span>
                            )}
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Accesos directos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-auto py-3 whitespace-normal text-left" asChild>
                <Link href="/dashboard/screenings">
                  <FileText className="h-4 w-4 mr-2 shrink-0" />
                  Ver Todas las Solicitudes
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 whitespace-normal text-left" asChild>
                <Link href="/dashboard/screenings?status=paid">
                  <Clock className="h-4 w-4 mr-2 shrink-0" />
                  Solicitudes Pendientes de Procesar
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 whitespace-normal text-left" asChild>
                <Link href="/dashboard/services">
                  <DollarSign className="h-4 w-4 mr-2 shrink-0" />
                  Gestionar Servicios
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 whitespace-normal text-left" asChild>
                <Link href="/dashboard/clientes">
                  <Users className="h-4 w-4 mr-2 shrink-0" />
                  Ver Clientes
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 whitespace-normal text-left" asChild>
                <Link href="/dashboard/api-keys">
                  <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                  Gestionar API Keys
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
