'use client'

/**
 * GenerateReportDialog Component
 *
 * Dialog to preview and generate PDF report from report data.
 * Shows a summary of the data and triggers PDF generation.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    AnimatedDialog as Dialog,
    AnimatedDialogContent as DialogContent,
    AnimatedDialogDescription as DialogDescription,
    AnimatedDialogFooter as DialogFooter,
    AnimatedDialogHeader as DialogHeader,
    AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog'
import {
    Loader2,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    ExternalLink,
    Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface GenerateReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    screeningId: string
    applicantName: string
    reportData: Record<string, any> | null
    onSuccess?: (reportUrl: string) => void
}

export function GenerateReportDialog({
    open,
    onOpenChange,
    screeningId,
    applicantName,
    reportData,
    onSuccess
}: GenerateReportDialogProps) {
    const [generating, setGenerating] = useState(false)
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        setGenerating(true)
        setError(null)

        try {
            const response = await fetch(`/api/screenings/${screeningId}/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al generar el reporte')
            }

            const data = await response.json()

            setGeneratedUrl(data.reportUrl)
            toast.success('Reporte generado exitosamente')
            onSuccess?.(data.reportUrl)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            setError(message)
            toast.error(message)
        } finally {
            setGenerating(false)
        }
    }

    const handleClose = () => {
        if (!generating) {
            setGeneratedUrl(null)
            setError(null)
            onOpenChange(false)
        }
    }

    // Count filled vs total fields
    const filledFieldsCount = reportData
        ? Object.values(reportData).filter(v => v !== null && v !== '' && v !== undefined).length
        : 0
    const totalFieldsCount = reportData ? Object.keys(reportData).length : 0

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Generar Reporte PDF
                    </DialogTitle>
                    <DialogDescription>
                        Genera el reporte en PDF para {applicantName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Status */}
                    {!generatedUrl && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Data Summary */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Datos del reporte</span>
                                    <Badge variant={filledFieldsCount > 0 ? 'default' : 'secondary'}>
                                        {filledFieldsCount} / {totalFieldsCount} campos
                                    </Badge>
                                </div>

                                {reportData && filledFieldsCount > 0 ? (
                                    <ScrollArea className="h-[200px] pr-4">
                                        <div className="space-y-1 text-sm">
                                            {Object.entries(reportData).map(([key, value]) => {
                                                if (value === null || value === '' || value === undefined) return null

                                                // Format the value for display
                                                let displayValue: string
                                                if (typeof value === 'boolean') {
                                                    displayValue = value ? 'Sí' : 'No'
                                                } else if (Array.isArray(value)) {
                                                    displayValue = `${value.length} registros`
                                                } else if (typeof value === 'object') {
                                                    displayValue = JSON.stringify(value)
                                                } else if (typeof value === 'string' && value.startsWith('http')) {
                                                    displayValue = '[Imagen/Archivo]'
                                                } else if (typeof value === 'number') {
                                                    displayValue = value.toLocaleString('es-MX')
                                                } else {
                                                    displayValue = String(value).length > 50
                                                        ? String(value).substring(0, 50) + '...'
                                                        : String(value)
                                                }

                                                // Convert camelCase to readable label
                                                const label = key
                                                    .replace(/([A-Z])/g, ' $1')
                                                    .replace(/^./, str => str.toUpperCase())
                                                    .trim()

                                                return (
                                                    <div key={key} className="py-1.5 border-b border-border/50 last:border-0">
                                                        <div className="text-muted-foreground text-xs">
                                                            {label}
                                                        </div>
                                                        <div className="font-medium">
                                                            {displayValue}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>No hay datos de reporte guardados</span>
                                    </div>
                                )}
                            </div>

                            {/* Generating Indicator */}
                            {generating && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center gap-3 py-6"
                                >
                                    <div className="relative">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Generando PDF...</p>
                                        <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Success State */}
                    {generatedUrl && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6 space-y-4"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">¡Reporte Generado!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    El PDF ha sido creado y guardado exitosamente
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button asChild variant="outline">
                                    <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Ver PDF
                                    </a>
                                </Button>
                                <Button asChild>
                                    <a href={generatedUrl} download>
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar
                                    </a>
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6 space-y-4"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900">
                                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-destructive">Error al Generar</h3>
                                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <DialogFooter>
                    {!generatedUrl && !error && (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={generating}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !reportData || filledFieldsCount === 0}
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Generar PDF
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {(generatedUrl || error) && (
                        <Button onClick={handleClose} className="w-full">
                            {generatedUrl ? 'Cerrar' : 'Intentar de nuevo'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
