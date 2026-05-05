'use client'

/**
 * Improved Screening Detail Component
 *
 * Redesigned for better UX with less scrolling and better space utilization
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Send,
  ExternalLink,
  ShieldCheck,
  User,
  MapPin,
  CreditCard,
  Trash2,
  Loader2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Activity,
  FileCheck,
  Info,
  Plus,
  X,
  File,
  Eye
} from 'lucide-react'
import { ReportUploader } from './ReportUploader'
import { ReportDataForm } from './ReportDataForm'
import { GenerateReportDialog } from './GenerateReportDialog'
import { CompleteScreeningDialog } from './CompleteScreeningDialog'
import { useDialogOrigin } from '@/components/ui/animated-dialog'
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog'
import { toast } from 'sonner'

interface Screening {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  advisorId: number | null
  advisor: {
    id: number
    name: string
    email: string
    phoneNumber: string
  } | null
  status: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  paymentAmount: number | null
  paymentCompletedAt: string | null
  reportUrl: string | null
  reportUrls: string[]
  reportFileKeys: string[]
  additionalEmails: string[]
  adminNotes: string | null
  formData: Record<string, any>
  reportData: Record<string, any> | null  // NEW: Report data from admin
  serviceId: string
  serviceName: string | null  // NEW: Service name for display
  serviceReportSchema: any | null  // NEW: Report schema from service
  isIdentityVerified: boolean
  verificationCompletedAt: string | null
  weeTrustDocumentId: string | null
  authorizationDocumentUrl: string | null
  authorizationSignedAt: string | null
  paymentLinkUrl: string | null
  identityVerificationId: string | null
  identityVerificationUrl: string | null
  identityVerifiedAt: string | null
  identityVerificationData: any
  // Applicant detail fields
  applicantPersonType: string | null
  applicantLegalRepresentative: string | null
  applicantRFC: string | null
  applicantStreet: string | null
  applicantColony: string | null
  applicantMunicipality: string | null
  applicantState: string | null
  applicantZipCode: string | null
  // Manual payment tracking
  manualPaymentMarkedBy: string | null
  manualPaymentMarkedAt: string | null
  manualPaymentReason: string | null
  manualPaymentAdmin?: {
    id: string
    fullName: string | null
    email: string
  } | null
}

interface ScreeningDetailProps {
  screeningId: string
}

export function ScreeningDetail({ screeningId }: ScreeningDetailProps) {
  const router = useRouter()
  const [screening, setScreening] = useState<Screening | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [uploadedReportUrls, setUploadedReportUrls] = useState<string[]>([])
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [identityDetailsOpen, setIdentityDetailsOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)
  const [loadingAuthDoc, setLoadingAuthDoc] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [markPaidReason, setMarkPaidReason] = useState('')
  const [markingAsPaid, setMarkingAsPaid] = useState(false)
  const [generateReportDialogOpen, setGenerateReportDialogOpen] = useState(false)
  const [deletingReportKey, setDeletingReportKey] = useState<string | null>(null)
  const [showDeleteReportConfirm, setShowDeleteReportConfirm] = useState<{ fileKey: string; fileName: string } | null>(null)
  const captureOrigin = useDialogOrigin()

  useEffect(() => {
    fetchScreening()
  }, [screeningId])

  useEffect(() => {
    if (screening?.reportFileKeys && screening.reportFileKeys.length > 0) {
      // Prefer file keys over URLs - construct fresh URLs from keys
      const freshUrls = screening.reportFileKeys.map(fileKey => `/api/files/${fileKey}`)
      setUploadedReportUrls(freshUrls)
    } else if (screening?.reportUrls && screening.reportUrls.length > 0) {
      // Extract file keys from old signed URLs for backward compatibility
      const extractedUrls = screening.reportUrls.map(encodedUrl => {
        // Handles various formats, including URI-encoded full URLs
        try {
          // First, decode any potential URI encoding. This is the crucial fix.
          const url = decodeURIComponent(encodedUrl);
          let key = url;

          if (key.startsWith('http')) {
            try {
              const pathname = new URL(key).pathname; // e.g., /preca-uploads/reports/file.pdf
              const pathParts = pathname.split('/').filter(p => p); // remove empty strings

              // If the first part of the path is the bucket name, remove it to get the true key
              if (pathParts[0] === 'preca-uploads') {
                key = pathParts.slice(1).join('/');
              } else {
                // Otherwise, assume the whole path is the key (minus leading slash)
                key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
              }
            } catch (e) {
              // Not a valid URL, proceed assuming it's a path/key
            }
          }

          // Remove query parameters from the key
          key = key.split('?')[0];

          // For bare filenames, assume they belong in 'reports/' as a fallback.
          if (key.indexOf('/') === -1) {
            key = `reports/${key}`;
          }

          return `/api/files/${key}`;
        } catch (error) {
          console.error('Error extracting file key from URL:', encodedUrl, error);
          return encodedUrl; // Fallback to original encoded URL
        }
      });
      setUploadedReportUrls(extractedUrls)
    }
  }, [screening?.reportFileKeys, screening?.reportUrls])

  const fetchScreening = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/screenings/${screeningId}`)
      if (!response.ok) throw new Error('Failed to fetch screening')
      const data = await response.json()
      setScreening(data)
    } catch (error) {
      toast.error('Error al cargar la solicitud')
      router.push('/dashboard/screenings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/screenings/${screeningId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Solicitud eliminada exitosamente')
      router.push('/dashboard/screenings')
    } catch (error) {
      toast.error('Error al eliminar la solicitud')
      setDeleting(false)
    }
  }

  const handleRetryAuthorization = async () => {
    setRetrying(true)
    try {
      const response = await fetch(`/api/admin/screenings/${screeningId}/retry-authorization`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to retry')
      toast.success('Documento de autorización reenviado')
      await fetchScreening()
    } catch (error) {
      toast.error('Error al reenviar documento')
    } finally {
      setRetrying(false)
    }
  }

  const handleUploadSuccess = (reportUrl: string) => {
    setUploadedReportUrls([...uploadedReportUrls, reportUrl])
    fetchScreening()
  }

  const handleCompleteSuccess = () => {
    setCompleteDialogOpen(false)
    fetchScreening()
  }

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Por favor ingresa un email')
      return
    }

    setAddingEmail(true)
    try {
      const response = await fetch(`/api/screenings/${screeningId}/additional-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar email')
      }

      toast.success('Email agregado exitosamente')
      setNewEmail('')
      await fetchScreening()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar email')
    } finally {
      setAddingEmail(false)
    }
  }

  const handleRemoveEmail = async (email: string) => {
    try {
      const response = await fetch(`/api/screenings/${screeningId}/additional-emails`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar email')
      }

      toast.success('Email eliminado exitosamente')
      await fetchScreening()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar email')
    }
  }

  const handleViewAuthorizationDocument = async () => {
    setLoadingAuthDoc(true)
    try {
      const response = await fetch(`/api/screenings/${screeningId}/documents/authorization`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al obtener documento')
      }

      const data = await response.json()

      // Open fresh URL in new tab
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al abrir documento')
    } finally {
      setLoadingAuthDoc(false)
    }
  }

  const handleDeleteReport = async (fileKey: string) => {
    setDeletingReportKey(fileKey)
    try {
      const response = await fetch(`/api/screenings/${screeningId}/reports/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar el reporte')
      }

      toast.success('Reporte eliminado exitosamente')
      setShowDeleteReportConfirm(null)
      await fetchScreening()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el reporte')
    } finally {
      setDeletingReportKey(null)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!markPaidReason.trim()) {
      toast.error('Por favor ingresa una razón para marcar el pago manualmente')
      return
    }

    setMarkingAsPaid(true)
    try {
      const response = await fetch(`/api/admin/screenings/${screeningId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: markPaidReason.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al marcar como pagado')
      }

      toast.success('Solicitud marcada como pagada exitosamente')
      setShowMarkPaidDialog(false)
      setMarkPaidReason('')
      await fetchScreening()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al marcar como pagado')
    } finally {
      setMarkingAsPaid(false)
    }
  }

  if (loading || !screening) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasSignedAuthorization = () => Boolean(screening.authorizationSignedAt)
  const hasIdentityVerification = () => Boolean(screening.identityVerifiedAt)
  const canUploadReport = () => ['paid', 'processing_bureau'].includes(screening.status)
  const canCompleteScreening = () =>
    screening.status === 'processing_bureau' && uploadedReportUrls.length > 0

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending_payment: {
        label: 'Pendiente de Pago',
        variant: 'secondary',
        icon: Clock,
        description: 'Esperando que el cliente complete el pago',
      },
      paid: {
        label: 'Pagado',
        variant: 'default',
        icon: CheckCircle2,
        description: 'Pago completado, procesando autorización',
      },
      processing_bureau: {
        label: 'En Proceso',
        variant: 'default',
        icon: Activity,
        description: 'Procesando con el buró de crédito',
      },
      completed: {
        label: 'Completado',
        variant: 'default',
        icon: FileCheck,
        description: 'Screening completado y enviado al cliente',
      },
      rejected: {
        label: 'Rechazado',
        variant: 'destructive',
        icon: AlertCircle,
        description: 'Solicitud rechazada',
      },
    }
    return configs[status] || configs.pending_payment
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date))
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const isImageUrl = (value: any): boolean => {
    if (typeof value !== 'string') return false
    return value.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(value)
  }

  const renderFormFieldValue = (key: string, value: any) => {
    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Sí' : 'No'}
        </Badge>
      )
    }

    // Handle image URLs
    if (isImageUrl(value)) {
      return (
        <div className="space-y-2">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Ver imagen
          </a>
          <div className="relative group">
            <img
              src={value}
              alt={key}
              className="max-w-full h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
              onClick={() => window.open(value, '_blank')}
            />
          </div>
        </div>
      )
    }

    // Handle regular text
    return <p className="font-medium break-words">{String(value)}</p>
  }

  const getVerificationScore = (type: string) => {
    const data = screening.identityVerificationData
    if (!data?.score) return null

    switch (type) {
      case 'overall':
        return data.score.overall
      case 'idValidation':
        return data.score.idValidation?.overall
      case 'liveness':
        return data.score.liveness?.overall
      case 'faceRecognition':
        return data.score.faceRecognition?.overall
      default:
        return null
    }
  }

  const statusConfig = getStatusConfig(screening.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{screening.applicantName}</h1>
            <p className="text-sm text-muted-foreground">ID: {screening.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Quick Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium truncate">{screening.applicantEmail}</p>
                </div>
                {screening.applicantPhone && (
                  <div>
                    <p className="text-muted-foreground text-xs">Teléfono</p>
                    <p className="font-medium">{screening.applicantPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Creado</p>
                  <p className="font-medium">{new Date(screening.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
                {screening.paymentCompletedAt && (
                  <div>
                    <p className="text-muted-foreground text-xs">Pago</p>
                    <p className="font-medium text-green-600">{formatCurrency(screening.paymentAmount)}</p>
                  </div>
                )}
              </div>

              {/* Status Progress */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className={screening.paymentCompletedAt ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Pago
                  </span>
                  <span className={hasSignedAuthorization() ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Autorización
                  </span>
                  <span className={screening.status === 'processing_bureau' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Procesando
                  </span>
                  <span className={screening.status === 'completed' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    Completado
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: screening.status === 'pending_payment' ? '0%' :
                        screening.status === 'paid' && !hasSignedAuthorization() ? '25%' :
                          screening.status === 'paid' && hasSignedAuthorization() ? '50%' :
                            screening.status === 'processing_bureau' ? '75%' :
                              screening.status === 'completed' ? '100%' : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Payment Link */}
              {screening.status === 'pending_payment' && screening.paymentLinkUrl && (
                <div className="pt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => navigator.clipboard.writeText(screening.paymentLinkUrl!)}
                  >
                    Copiar Link de Pago
                  </Button>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(screening.paymentLinkUrl!, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Mark as Paid Button (Admin only) */}
              {screening.status === 'pending_payment' && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full h-8 gap-1"
                    onClick={(e) => {
                      captureOrigin(e)
                      setShowMarkPaidDialog(true)
                    }}
                  >
                    <DollarSign className="h-3 w-3" />
                    Marcar como Pagado
                  </Button>
                </div>
              )}

              {/* Manual Payment Info */}
              {screening.manualPaymentMarkedAt && (
                <div className="pt-2 p-2 bg-muted/50 border rounded-md">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium">
                        Marcado como pagado manualmente
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(screening.manualPaymentMarkedAt).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      {screening.manualPaymentReason && (
                        <p className="text-muted-foreground mt-1">
                          Razón: {screening.manualPaymentReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applicant Details (RFC, Address, etc.) - Only show if available */}
          {(screening.applicantRFC || screening.applicantStreet) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Datos del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {screening.applicantPersonType && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de Persona</p>
                      <Badge variant="outline" className="font-medium">
                        {screening.applicantPersonType === 'physical' ? 'Persona Física' : 'Persona Moral'}
                      </Badge>
                    </div>
                  )}
                  {screening.applicantRFC && (
                    <div>
                      <p className="text-xs text-muted-foreground">RFC</p>
                      <p className="font-mono font-medium">{screening.applicantRFC}</p>
                    </div>
                  )}
                </div>

                {screening.applicantLegalRepresentative && (
                  <div>
                    <p className="text-xs text-muted-foreground">Representante Legal</p>
                    <p className="font-medium">{screening.applicantLegalRepresentative}</p>
                  </div>
                )}

                {screening.applicantStreet && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Dirección</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">{screening.applicantStreet}</p>
                        <p className="text-muted-foreground">
                          {screening.applicantColony && `Col. ${screening.applicantColony}, `}
                          {screening.applicantMunicipality}
                        </p>
                        <p className="text-muted-foreground">
                          {screening.applicantState}
                          {screening.applicantZipCode && `, C.P. ${screening.applicantZipCode}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Advisor Info - Compact */}
          {screening.advisor && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Briefcase className="h-4 w-4" />
                  Asesor Inmobiliario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">{screening.advisor.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <Badge variant="outline" className="font-mono">#{screening.advisor.id}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-mono text-xs">{screening.advisor.phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Email Recipients */}
          {(screening.status === 'paid' || screening.status === 'processing_bureau' || screening.status === 'completed') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Destinatarios Adicionales
                </CardTitle>
                <CardDescription className="text-xs">
                  Emails que recibirán una copia del reporte al completar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current Additional Emails */}
                {screening.additionalEmails.length > 0 ? (
                  <div className="space-y-2">
                    {screening.additionalEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                      >
                        <span className="font-mono text-xs">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                          className="h-7 px-2 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay destinatarios adicionales configurados
                  </p>
                )}

                {/* Add New Email */}
                {screening.status !== 'completed' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                      placeholder="nuevo@email.com"
                      className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={addingEmail}
                    />
                    <Button
                      onClick={handleAddEmail}
                      disabled={addingEmail || !newEmail.trim()}
                      size="sm"
                    >
                      {addingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Authorization Status */}
          {(screening.status === 'paid' || screening.status === 'processing_bureau' || screening.status === 'completed') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                  <span className="text-sm">Autorización</span>
                  <div className="flex items-center gap-2">
                    {hasSignedAuthorization() ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Firmado
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </Badge>
                        {screening.status === 'paid' && !screening.weeTrustDocumentId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRetryAuthorization}
                            disabled={retrying}
                            className="h-6 text-xs"
                          >
                            {retrying ? 'Reintentando...' : 'Reintentar'}
                          </Button>
                        )}
                      </>
                    )}
                    {screening.weeTrustDocumentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6"
                        onClick={handleViewAuthorizationDocument}
                        disabled={loadingAuthDoc}
                      >
                        {loadingAuthDoc ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        Ver
                      </Button>
                    )}
                  </div>
                </div>

                {screening.identityVerificationId && (
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-sm">Identidad</span>
                    <div className="flex items-center gap-2">
                      {hasIdentityVerification() ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                      {screening.identityVerificationUrl && (
                        <Button variant="ghost" size="sm" asChild className="h-6">
                          <a href={screening.identityVerificationUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warning if waiting for authorization */}
          {!hasSignedAuthorization() && screening.status === 'paid' && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Esperando Autorización
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      El cliente debe firmar el documento de autorización antes de procesar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Files Card - Show uploaded reports for all non-pending statuses */}
          {uploadedReportUrls.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reportes Subidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {uploadedReportUrls.length} {uploadedReportUrls.length === 1 ? 'archivo' : 'archivos'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uploadedReportUrls.map((url, index) => {
                      // Extract clean filename and file key from URL
                      // Handle formats: "/api/files/reports/timestamp-file.pdf" or legacy URLs
                      let fileName = `Archivo ${index + 1}`
                      let fileKey = screening.reportFileKeys?.[index] || ''
                      try {
                        const urlParts = url.split('/')
                        const lastPart = urlParts[urlParts.length - 1]
                        // Remove query parameters if any
                        const cleanName = lastPart.split('?')[0]
                        if (cleanName && cleanName.length > 0) {
                          fileName = cleanName
                        }
                        // If no fileKey from array, try to extract from URL
                        if (!fileKey && url.includes('/api/files/')) {
                          fileKey = url.replace('/api/files/', '')
                        }
                      } catch (error) {
                        console.error('Error extracting filename:', error)
                      }

                      const isDeleting = deletingReportKey === fileKey

                      return (
                        <div
                          key={url}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <File className="h-4 w-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                            <span className="text-sm text-green-700 dark:text-green-300 truncate">
                              {decodeURIComponent(fileName)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                Ver
                              </a>
                            </Button>
                            {screening.status !== 'completed' && fileKey && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setShowDeleteReportConfirm({ fileKey, fileName })}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions Card - Only for non-completed screenings */}
          {(canUploadReport() || canCompleteScreening()) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Conditional: ReportDataForm if service has reportSchema, otherwise ReportUploader */}
                {canUploadReport() && hasSignedAuthorization() && (
                  <>
                    {screening.serviceReportSchema ? (
                      <ReportDataForm
                        screeningId={screening.id}
                        reportSchema={screening.serviceReportSchema}
                        initialData={screening.reportData || {}}
                        onSaveSuccess={fetchScreening}
                        onGenerateClick={() => setGenerateReportDialogOpen(true)}
                      />
                    ) : (
                      <ReportUploader
                        screeningId={screening.id}
                        onUploadSuccess={handleUploadSuccess}
                        currentReportUrls={uploadedReportUrls}
                      />
                    )}
                  </>
                )}

                {canCompleteScreening() && (
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      captureOrigin(e)
                      setCompleteDialogOpen(true)
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Completar Screening
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Identity Verification - Collapsible */}
          {hasIdentityVerification() && screening.identityVerificationData?.ocr && (
            <Collapsible open={identityDetailsOpen} onOpenChange={setIdentityDetailsOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Datos de INE
                      </CardTitle>
                      {identityDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 text-sm">
                    {screening.identityVerificationData.ocr.curp && (
                      <div>
                        <p className="text-xs text-muted-foreground">CURP</p>
                        <p className="font-mono bg-secondary/50 px-2 py-1 rounded">
                          {screening.identityVerificationData.ocr.curp}
                        </p>
                      </div>
                    )}

                    {screening.identityVerificationData.ocr.name?.fullName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Nombre Completo</p>
                        <p className="font-medium">
                          {screening.identityVerificationData.ocr.name.fullName}
                        </p>
                      </div>
                    )}

                    {screening.identityVerificationData.ocr.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p>{screening.identityVerificationData.ocr.address}</p>
                      </div>
                    )}

                    {screening.identityVerificationData.score && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Puntajes de Verificación</p>
                        <div className="grid grid-cols-2 gap-2">
                          {getVerificationScore('overall') && (
                            <div className="p-2 bg-secondary/30 rounded text-center">
                              <p className="text-xs text-muted-foreground">General</p>
                              <p className="text-lg font-bold text-green-600">
                                {(getVerificationScore('overall')!.value * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                          {getVerificationScore('idValidation') && (
                            <div className="p-2 bg-secondary/30 rounded text-center">
                              <p className="text-xs text-muted-foreground">ID</p>
                              <p className="text-lg font-bold text-green-600">
                                {(getVerificationScore('idValidation')!.value * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Form Data - Collapsible */}
          {screening.formData && Object.keys(screening.formData).length > 0 && (
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Datos del Formulario
                      </CardTitle>
                      {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 text-sm">
                    {Object.entries(screening.formData).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{key}</p>
                        <div className="pl-2">
                          {renderFormFieldValue(key, value)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Admin Notes */}
          {screening.adminNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas del Administrador</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {screening.adminNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar solicitud?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente la solicitud de{' '}
              <strong>{screening.applicantName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <CompleteScreeningDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        screeningId={screening.id}
        reportUrls={uploadedReportUrls}
        applicantName={screening.applicantName}
        applicantEmail={screening.applicantEmail}
        advisorName={screening.advisor?.name}
        advisorEmail={screening.advisor?.email}
        additionalEmails={screening.additionalEmails}
        onSuccess={handleCompleteSuccess}
      />

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={generateReportDialogOpen}
        onOpenChange={setGenerateReportDialogOpen}
        screeningId={screening.id}
        applicantName={screening.applicantName}
        reportData={screening.reportData}
        onSuccess={(reportUrl) => {
          handleUploadSuccess(reportUrl)
          setGenerateReportDialogOpen(false)
        }}
      />

      {/* Delete Report Confirmation Dialog */}
      <Dialog open={!!showDeleteReportConfirm} onOpenChange={(open) => !open && setShowDeleteReportConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar reporte?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el archivo{' '}
              <strong>{showDeleteReportConfirm?.fileName}</strong>.
              No podrás recuperarlo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteReportConfirm(null)}
              disabled={!!deletingReportKey}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteReportConfirm && handleDeleteReport(showDeleteReportConfirm.fileKey)}
              disabled={!!deletingReportKey}
            >
              {deletingReportKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pagado</DialogTitle>
            <DialogDescription>
              Esta acción marcará la solicitud como pagada manualmente.
              Se enviará el documento de autorización al cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Razón del pago manual *</label>
              <textarea
                value={markPaidReason}
                onChange={(e) => setMarkPaidReason(e.target.value)}
                placeholder="Ej: Pago recibido por transferencia bancaria, referencia #12345"
                className="mt-1.5 w-full p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                disabled={markingAsPaid}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta razón quedará registrada para auditoría.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMarkPaidDialog(false)}
              disabled={markingAsPaid}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={markingAsPaid || !markPaidReason.trim()}
            >
              {markingAsPaid ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
