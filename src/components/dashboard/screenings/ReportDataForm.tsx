'use client'

/**
 * ReportDataForm Component
 *
 * Dynamic form for admins to fill in report data based on service's ReportSchema.
 * Similar pattern to DynamicFormRenderer but for report data (admin-side).
 */

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
    Loader2,
    Save,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    FileText,
    Upload,
    Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

// Types based on ReportSchema
interface ReportFieldOption {
    value: string
    label: string
    color?: string
}

interface ReportTableColumn {
    key: string
    label: string
    type: 'text' | 'number' | 'currency' | 'date' | 'status'
    width?: string
}

interface FieldDependency {
    field: string
    value?: any
    operator?: 'equals' | 'notEquals' | 'contains'
}

interface ReportFieldValidation {
    pattern?: string
    message?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
}

interface ReportFieldImagesValidation {
    maxItems?: number
}

interface ReportField {
    id: string
    name: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'date' |
    'select' | 'boolean' | 'table' | 'score' | 'status' | 'image' | 'images' | 'section_header'
    required: boolean
    placeholder?: string
    helpText?: string
    defaultValue?: any
    validation?: ReportFieldValidation
    options?: ReportFieldOption[]
    tableColumns?: ReportTableColumn[]
    dependsOn?: FieldDependency
    section?: string
    order: number
}

interface ReportSection {
    id: string
    title: string
    order: number
}

interface ReportSchema {
    version: string
    templateId: string
    sections: ReportSection[]
    fields: ReportField[]
}

interface ReportDataFormProps {
    screeningId: string
    reportSchema: ReportSchema
    initialData?: Record<string, any>
    onSaveSuccess?: () => void
    onGenerateClick?: () => void
}

export function ReportDataForm({
    screeningId,
    reportSchema,
    initialData = {},
    onSaveSuccess,
    onGenerateClick
}: ReportDataFormProps) {
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Build default values from schema
    const defaultValues = useMemo(() => {
        const defaults: Record<string, any> = {}
        reportSchema.fields.forEach(field => {
            if (field.type === 'section_header') return
            defaults[field.name] = initialData[field.name] ?? field.defaultValue ?? ''
        })
        return defaults
    }, [reportSchema.fields, initialData])

    const form = useForm({
        defaultValues
    })

    // Group fields by section
    const fieldsBySection = useMemo(() => {
        const grouped = new Map<string | null, ReportField[]>()
        grouped.set(null, []) // Fields without section

        reportSchema.sections.forEach(section => {
            grouped.set(section.id, [])
        })

        reportSchema.fields.forEach(field => {
            const sectionId = field.section || null
            const existing = grouped.get(sectionId) || []
            existing.push(field)
            grouped.set(sectionId, existing)
        })

        return grouped
    }, [reportSchema])

    // Check if field should be visible based on dependencies
    const isFieldVisible = (field: ReportField): boolean => {
        if (!field.dependsOn) return true

        const dependentValue = form.watch(field.dependsOn.field)
        const operator = field.dependsOn.operator || 'equals'

        switch (operator) {
            case 'equals':
                return dependentValue === field.dependsOn.value
            case 'notEquals':
                return dependentValue !== field.dependsOn.value
            case 'contains':
                return Array.isArray(dependentValue) && dependentValue.includes(field.dependsOn.value)
            default:
                return true
        }
    }

    const handleSave = async (data: Record<string, any>) => {
        setSaving(true)
        try {
            const response = await fetch(`/api/screenings/${screeningId}/report-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportData: data })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al guardar datos del reporte')
            }

            setLastSaved(new Date())
            toast.success('Datos del reporte guardados')
            onSaveSuccess?.()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const renderFieldInput = (field: ReportField, formField: any) => {
        switch (field.type) {
            case 'section_header':
                return null // Handled separately

            case 'text':
                return (
                    <Input
                        placeholder={field.placeholder}
                        {...formField}
                        value={formField.value ?? ''}
                    />
                )

            case 'textarea':
                return (
                    <Textarea
                        placeholder={field.placeholder}
                        rows={4}
                        {...formField}
                        value={formField.value ?? ''}
                    />
                )

            case 'number':
                return (
                    <Input
                        type="number"
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        step="any"
                        {...formField}
                        value={formField.value ?? ''}
                        onChange={(e) => formField.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                )

            case 'currency':
                return (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                            type="number"
                            placeholder={field.placeholder || "0.00"}
                            step="0.01"
                            className="pl-7"
                            {...formField}
                            value={formField.value ?? ''}
                            onChange={(e) => formField.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                    </div>
                )

            case 'percentage':
                return (
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder={field.placeholder || "0"}
                            min={0}
                            max={100}
                            step="0.1"
                            className="pr-8"
                            {...formField}
                            value={formField.value ?? ''}
                            onChange={(e) => formField.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                )

            case 'date':
                return (
                    <Input
                        type="date"
                        {...formField}
                        value={formField.value ?? ''}
                    />
                )

            case 'select':
            case 'status':
                return (
                    <Select
                        value={formField.value || ''}
                        onValueChange={formField.onChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {field.type === 'status' && option.color ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: option.color }}
                                            />
                                            {option.label}
                                        </div>
                                    ) : (
                                        option.label
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )

            case 'boolean':
                return (
                    <div className="flex items-center space-x-3">
                        <Switch
                            checked={formField.value ?? false}
                            onCheckedChange={formField.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                            {formField.value ? 'Sí' : 'No'}
                        </span>
                    </div>
                )

            case 'score':
                return (
                    <div className="space-y-2">
                        <Input
                            type="number"
                            placeholder={field.placeholder || "0-850"}
                            min={field.validation?.min || 300}
                            max={field.validation?.max || 850}
                            {...formField}
                            value={formField.value ?? ''}
                            onChange={(e) => formField.onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                        />
                        {formField.value && (
                            <ScoreIndicator score={formField.value} />
                        )}
                    </div>
                )

            case 'table':
                return (
                    <TableFieldEditor
                        field={field}
                        value={formField.value || []}
                        onChange={formField.onChange}
                    />
                )

            case 'image':
                return (
                    <ImageUploadField
                        value={formField.value}
                        onChange={formField.onChange}
                        placeholder={field.placeholder}
                    />
                )

            case 'images':
                return (
                    <MultipleImageUploadField
                        value={formField.value || []}
                        onChange={formField.onChange}
                        placeholder={field.placeholder}
                        maxItems={(field.validation as any)?.maxItems || 5}
                    />
                )

            default:
                return <Input {...formField} value={formField.value ?? ''} />
        }
    }

    const renderField = (field: ReportField) => {
        if (field.type === 'section_header') return null
        if (!isFieldVisible(field)) return null

        return (
            <FormField
                key={field.id}
                control={form.control}
                name={field.name}
                rules={{ required: field.required ? `${field.label} es requerido` : false }}
                render={({ field: formField }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                        </FormLabel>
                        <FormControl>
                            {renderFieldInput(field, formField)}
                        </FormControl>
                        {field.helpText && (
                            <FormDescription>{field.helpText}</FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        )
    }

    const renderSection = (sectionId: string | null, fields: ReportField[]) => {
        const visibleFields = fields
            .filter(f => f.type !== 'section_header' && isFieldVisible(f))
            .sort((a, b) => a.order - b.order)

        if (visibleFields.length === 0) return null

        const section = sectionId
            ? reportSchema.sections.find(s => s.id === sectionId)
            : null

        return (
            <motion.div
                key={sectionId || 'no-section'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                {section && (
                    <>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-lg">{section.title}</h3>
                        </div>
                        <Separator />
                    </>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                    {visibleFields.map(field => (
                        <div
                            key={field.id}
                            className={
                                ['textarea', 'table', 'images'].includes(field.type)
                                    ? 'md:col-span-2'
                                    : ''
                            }
                        >
                            {renderField(field)}
                        </div>
                    ))}
                </div>
            </motion.div>
        )
    }

    // Get sorted sections
    const sortedSections = useMemo(() => {
        const entries: Array<{ id: string | null; fields: ReportField[] }> = []

        // First, add fields without section
        const noSectionFields = fieldsBySection.get(null) || []
        if (noSectionFields.length > 0) {
            entries.push({ id: null, fields: noSectionFields })
        }

        // Then add sorted sections
        reportSchema.sections
            .sort((a, b) => a.order - b.order)
            .forEach(section => {
                const fields = fieldsBySection.get(section.id) || []
                if (fields.length > 0) {
                    entries.push({ id: section.id, fields })
                }
            })

        return entries
    }, [fieldsBySection, reportSchema.sections])

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Datos del Reporte
                    </CardTitle>
                    {lastSaved && (
                        <Badge variant="outline" className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Guardado {lastSaved.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                        {sortedSections.map(({ id, fields }) => renderSection(id, fields))}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                variant="outline"
                                className="flex-1"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {saving ? 'Guardando...' : 'Guardar Datos'}
                            </Button>

                            {onGenerateClick && (
                                <Button
                                    type="button"
                                    onClick={onGenerateClick}
                                    className="flex-1"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generar PDF
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

// Score indicator component with visual
function ScoreIndicator({ score }: { score: number }) {
    const getScoreColor = (score: number): string => {
        if (score >= 700) return 'bg-green-500'
        if (score >= 600) return 'bg-yellow-500'
        if (score >= 500) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const getScoreLabel = (score: number): string => {
        if (score >= 700) return 'Excelente'
        if (score >= 600) return 'Bueno'
        if (score >= 500) return 'Regular'
        return 'Bajo'
    }

    const percentage = Math.min(100, Math.max(0, ((score - 300) / (850 - 300)) * 100))

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">300</span>
                <span className="font-medium">{getScoreLabel(score)}</span>
                <span className="text-muted-foreground">850</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full ${getScoreColor(score)} transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

// Table field editor component
function TableFieldEditor({
    field,
    value,
    onChange
}: {
    field: ReportField
    value: Record<string, any>[]
    onChange: (value: Record<string, any>[]) => void
}) {
    const columns = field.tableColumns || []

    const addRow = () => {
        const newRow: Record<string, any> = {}
        columns.forEach(col => {
            newRow[col.key] = col.type === 'number' || col.type === 'currency' ? 0 : ''
        })
        onChange([...value, newRow])
    }

    const updateRow = (index: number, key: string, newValue: any) => {
        const updated = [...value]
        updated[index] = { ...updated[index], [key]: newValue }
        onChange(updated)
    }

    const removeRow = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-3">
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className="px-3 py-2 text-left font-medium"
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {value.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-3 py-4 text-center text-muted-foreground">
                                    Sin registros. Haz clic en "Agregar" para comenzar.
                                </td>
                            </tr>
                        ) : (
                            value.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t">
                                    {columns.map(col => (
                                        <td key={col.key} className="px-2 py-1">
                                            {col.type === 'currency' ? (
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="h-8 pl-5 text-xs"
                                                        value={row[col.key] ?? ''}
                                                        onChange={e => updateRow(rowIndex, col.key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            ) : col.type === 'number' ? (
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={row[col.key] ?? ''}
                                                    onChange={e => updateRow(rowIndex, col.key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                />
                                            ) : col.type === 'date' ? (
                                                <Input
                                                    type="date"
                                                    className="h-8 text-xs"
                                                    value={row[col.key] ?? ''}
                                                    onChange={e => updateRow(rowIndex, col.key, e.target.value)}
                                                />
                                            ) : col.type === 'status' ? (
                                                <Badge variant="outline" className="text-xs">
                                                    {row[col.key] || '-'}
                                                </Badge>
                                            ) : (
                                                <Input
                                                    className="h-8 text-xs"
                                                    value={row[col.key] ?? ''}
                                                    onChange={e => updateRow(rowIndex, col.key, e.target.value)}
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => removeRow(rowIndex)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Registro
            </Button>
        </div>
    )
}

// Image upload field
function ImageUploadField({
    value,
    onChange,
    placeholder
}: {
    value: string | null
    onChange: (url: string | null) => void
    placeholder?: string
}) {
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate it's an image
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes')
            return
        }

        try {
            setUploading(true)

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Error al subir imagen')
            }

            const data = await response.json()
            // Save fileKey instead of fileUrl (fileUrl expires, fileKey is permanent)
            onChange(data.fileKey)
            toast.success('Imagen subida')
        } catch (error) {
            toast.error('Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    // Convert fileKey to display URL (handles both old URLs and new fileKeys)
    const getImageDisplayUrl = (fileKeyOrUrl: string) => {
        if (fileKeyOrUrl.startsWith('http')) {
            return fileKeyOrUrl
        }
        return `/api/files/${fileKeyOrUrl}`
    }

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative group">
                    <img
                        src={getImageDisplayUrl(value)}
                        alt="Uploaded"
                        className="max-h-48 rounded-lg border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onChange(null)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <label className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                        {uploading ? (
                            <>
                                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                                <span className="text-sm text-muted-foreground">Subiendo...</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">
                                    {placeholder || 'Click para subir imagen'}
                                </span>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    )
}

// Multiple images upload field
function MultipleImageUploadField({
    value,
    onChange,
    placeholder,
    maxItems = 5
}: {
    value: string[]
    onChange: (urls: string[]) => void
    placeholder?: string
    maxItems?: number
}) {
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Check if adding these would exceed max
        const remainingSlots = maxItems - value.length
        if (remainingSlots <= 0) {
            toast.error(`Máximo ${maxItems} imágenes permitidas`)
            return
        }

        // Take only the number of files we can accept
        const filesToUpload = Array.from(files).slice(0, remainingSlots)

        // Validate all are images
        for (const file of filesToUpload) {
            if (!file.type.startsWith('image/')) {
                toast.error('Solo se permiten imágenes')
                return
            }
        }

        try {
            setUploading(true)
            const uploadedUrls: string[] = []

            for (const file of filesToUpload) {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/files/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!response.ok) {
                    throw new Error('Error al subir imagen')
                }

                const data = await response.json()
                // Save fileKey instead of fileUrl (fileUrl expires, fileKey is permanent)
                uploadedUrls.push(data.fileKey)
            }

            onChange([...value, ...uploadedUrls])
            toast.success(`${uploadedUrls.length} imagen(es) subida(s)`)
        } catch (error) {
            toast.error('Error al subir imagen')
        } finally {
            setUploading(false)
            // Reset the input
            e.target.value = ''
        }
    }

    const removeImage = (index: number) => {
        const newValue = value.filter((_, i) => i !== index)
        onChange(newValue)
    }

    const canAddMore = value.length < maxItems

    // Convert fileKey to display URL (handles both old URLs and new fileKeys)
    const getImageDisplayUrl = (fileKeyOrUrl: string) => {
        // If it's already a full URL, use it as-is (backward compatibility)
        if (fileKeyOrUrl.startsWith('http')) {
            return fileKeyOrUrl
        }
        // Otherwise, use the API route to fetch by fileKey
        return `/api/files/${fileKeyOrUrl}`
    }

    return (
        <div className="space-y-3">
            {/* Display uploaded images */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {value.map((fileKey, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={getImageDisplayUrl(fileKey)}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload area */}
            {canAddMore && (
                <label className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                        {uploading ? (
                            <>
                                <Loader2 className="h-6 w-6 text-primary animate-spin mb-1" />
                                <span className="text-sm text-muted-foreground">Subiendo...</span>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {placeholder || 'Click para agregar imágenes'}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {value.length} de {maxItems} imágenes
                                </span>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            )}

            {!canAddMore && (
                <p className="text-xs text-muted-foreground text-center">
                    Máximo de {maxItems} imágenes alcanzado
                </p>
            )}
        </div>
    )
}
