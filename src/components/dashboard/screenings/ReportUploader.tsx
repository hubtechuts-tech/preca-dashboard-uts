'use client'

/**
 * Report Uploader Component
 *
 * Drag-and-drop file uploader with excellent UX
 * Supports PDF, DOCX, PNG, JPG files up to 10MB
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  File
} from 'lucide-react'

interface ReportUploaderProps {
  screeningId: string
  onUploadSuccess: (reportUrl: string) => void
  currentReportUrls: string[]
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG'
}

export function ReportUploader({
  screeningId,
  onUploadSuccess,
  currentReportUrls
}: ReportUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo se aceptan PDF, DOC, DOCX, PNG o JPG.'
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return `El archivo es demasiado grande (${sizeMB} MB). El tamaño máximo es 10 MB.`
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    setSuccess(false)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError(null)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`/api/screenings/${screeningId}/report`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir el archivo')
      }

      const data = await response.json()
      setSuccess(true)
      onUploadSuccess(data.reportUrl)

      // Clear file after 2 seconds
      setTimeout(() => {
        setSelectedFile(null)
        setSuccess(false)
        setUploadProgress(0)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getFileTypeLabel = (type: string) => {
    return FILE_TYPE_LABELS[type] || 'FILE'
  }

  return (
    <div className="space-y-4">
      {/* Current Reports Status */}
      {currentReportUrls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              {currentReportUrls.length} {currentReportUrls.length === 1 ? 'archivo subido' : 'archivos subidos'}
            </span>
          </div>
          <div className="space-y-2">
            {currentReportUrls.map((url, index) => {
              const fileName = url.split('/').pop() || `Archivo ${index + 1}`
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
                  <Button variant="ghost" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Ver
                    </a>
                  </Button>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Drag and Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
          ${selectedFile ? 'bg-secondary/30' : 'bg-background'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className={`
                  p-4 rounded-full transition-colors duration-200
                  ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary'}
                `}>
                  <Upload className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {Object.values(FILE_TYPE_LABELS).map((label, index) => (
                  <Badge key={index} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Tamaño máximo: 10 MB
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar Archivo
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-4"
            >
              {/* File Info */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <Badge variant="secondary">
                      {getFileTypeLabel(selectedFile.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                {!uploading && !success && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subiendo...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Archivo subido exitosamente
                  </span>
                </motion.div>
              )}

              {/* Upload Button */}
              {!uploading && !success && (
                <Button
                  onClick={handleUpload}
                  className="w-full"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Reporte
                </Button>
              )}

              {uploading && (
                <Button disabled className="w-full" size="lg">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
