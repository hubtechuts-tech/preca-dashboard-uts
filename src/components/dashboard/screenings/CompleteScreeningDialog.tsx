'use client'

/**
 * Complete Screening Dialog Component
 *
 * Dialog for completing a screening and sending the report to the client
 * Includes admin notes form and confirmation
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Mail,
  UserCheck
} from 'lucide-react'

interface CompleteScreeningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  screeningId: string
  reportUrls: string[]
  applicantName: string
  applicantEmail: string
  advisorName?: string | null
  advisorEmail?: string | null
  additionalEmails?: string[]
  onSuccess: () => void
}

export function CompleteScreeningDialog({
  open,
  onOpenChange,
  screeningId,
  reportUrls,
  applicantName,
  applicantEmail,
  advisorName,
  advisorEmail,
  additionalEmails = [],
  onSuccess
}: CompleteScreeningDialogProps) {
  const [adminNotes, setAdminNotes] = useState('')
  const [sendToAdvisor, setSendToAdvisor] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/screenings/${screeningId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportUrls,
          adminNotes: adminNotes.trim() || undefined,
          sendToAdvisor,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al completar la solicitud')
      }

      setSuccess(true)

      // Wait a bit to show success message, then close and refresh
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al completar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setAdminNotes('')
      setSendToAdvisor(false)
      setError(null)
      setSuccess(false)
      onOpenChange(false)
    }
  }

  // Calculate total recipients
  const totalRecipients = 1 + // applicant (always)
    (sendToAdvisor && advisorEmail ? 1 : 0) + // advisor (if checkbox is checked and exists)
    additionalEmails.length // additional emails

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Completar Solicitud
                </DialogTitle>
                <DialogDescription>
                  Se enviará el reporte a <strong>{applicantName}</strong> por correo electrónico
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* What will happen */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Cambio de Estado</p>
                        <p className="text-sm text-muted-foreground">
                          La solicitud se marcará como completada
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Envío de Email</p>
                        <p className="text-sm text-muted-foreground">
                          Se enviará un email con {reportUrls.length} {reportUrls.length === 1 ? 'reporte' : 'reportes'} adjunto{reportUrls.length > 1 ? 's' : ''} a {totalRecipients} {totalRecipients === 1 ? 'destinatario' : 'destinatarios'}
                        </p>
                        <div className="text-xs text-muted-foreground/80 space-y-0.5 mt-1">
                          <div>• {applicantName} ({applicantEmail})</div>
                          {sendToAdvisor && advisorEmail && (
                            <div>• {advisorName} - Asesor ({advisorEmail})</div>
                          )}
                          {additionalEmails.map((email, idx) => (
                            <div key={idx}>• {email}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Acceso al{reportUrls.length > 1 ? 's' : ''} Reporte{reportUrls.length > 1 ? 's' : ''}</p>
                        <p className="text-sm text-muted-foreground">
                          El cliente recibirá {reportUrls.length === 1 ? 'el archivo' : `los ${reportUrls.length} archivos`} en su correo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Send to Advisor Checkbox (only show if advisor exists) */}
                {advisorEmail && (
                  <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
                    <Checkbox
                      id="sendToAdvisor"
                      checked={sendToAdvisor}
                      onCheckedChange={(checked) => setSendToAdvisor(checked === true)}
                      disabled={submitting}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="sendToAdvisor"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Enviar también al asesor
                        </div>
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {advisorName} ({advisorEmail}) recibirá una copia del reporte
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin Notes (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">
                    Notas Administrativas <span className="text-muted-foreground">(Opcional)</span>
                  </Label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Agrega notas sobre el procesamiento de esta solicitud..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas notas son para uso interno y no se enviarán al cliente
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                  >
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">Error</p>
                      <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="min-w-[140px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Completar y Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="p-4 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <h3 className="text-xl font-semibold">Solicitud Completada</h3>
                  <p className="text-muted-foreground">
                    El reporte ha sido enviado exitosamente a {applicantName}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email enviado con {reportUrls.length} archivo{reportUrls.length > 1 ? 's' : ''} adjunto{reportUrls.length > 1 ? 's' : ''}</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
