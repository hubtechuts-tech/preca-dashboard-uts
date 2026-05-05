'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormSchema, FormField as FormFieldType } from '@/domain/value-objects/FormSchema';
import { Loader2, Upload } from 'lucide-react';

// shadcn/ui imports
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

interface DynamicFormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isSubmitting?: boolean;
}

export function DynamicFormRenderer({
  schema,
  initialData,
  onSubmit,
  isSubmitting = false
}: DynamicFormRendererProps) {
  const form = useForm({
    defaultValues: initialData || {},
  });

  const handleSubmit = async (data: Record<string, any>) => {
    // Validate using domain schema
    const validation = schema.validateFormData(data);

    if (!validation.valid) {
      // Set form errors
      validation.errors.forEach(err => {
        form.setError(err.field, {
          type: 'manual',
          message: err.message
        });
      });
      return;
    }

    await onSubmit(data);
  };

  // Check if field should be visible based on dependencies
  const isFieldVisible = (field: FormFieldType): boolean => {
    if (!field.dependsOn) return true;

    const dependentValue = form.watch(field.dependsOn.field);
    const operator = field.dependsOn.operator || 'equals';

    switch (operator) {
      case 'equals':
        return dependentValue === field.dependsOn.value;
      case 'notEquals':
        return dependentValue !== field.dependsOn.value;
      case 'contains':
        return Array.isArray(dependentValue) && dependentValue.includes(field.dependsOn.value);
      default:
        return true;
    }
  };

  const renderField = (field: FormFieldType) => {
    // Skip if not visible
    if (!isFieldVisible(field)) return null;

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.name}
        rules={{ required: field.required ? `${field.label} es requerido` : false }}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
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
    );
  };

  const renderFieldInput = (field: FormFieldType, formField: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            {...formField}
            value={formField.value ?? ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={4}
            {...formField}
            value={formField.value ?? ''}
          />
        );

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
        );

      case 'date':
        return (
          <Input
            type="date"
            {...formField}
            value={formField.value ?? ''}
          />
        );

      case 'select':
        return (
          <Select
            value={formField.value}
            onValueChange={formField.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={formField.value}
            onValueChange={formField.onChange}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
                <label htmlFor={`${field.name}-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={formField.value?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const current = formField.value || [];
                    if (checked) {
                      formField.onChange([...current, option.value]);
                    } else {
                      formField.onChange(current.filter((v: string) => v !== option.value));
                    }
                  }}
                  id={`${field.name}-${option.value}`}
                />
                <label htmlFor={`${field.name}-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
              id={field.name}
            />
            <label htmlFor={field.name} className="text-sm cursor-pointer">
              Sí
            </label>
          </div>
        );

      case 'file':
        return (
          <FileUploadField
            field={field}
            value={formField.value}
            onChange={formField.onChange}
          />
        );

      default:
        return <Input {...formField} value={formField.value ?? ''} />;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {schema.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => renderField(field))}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Enviando...' : 'Crear Screening'}
        </Button>
      </form>
    </Form>
  );
}

// File Upload Field Component
function FileUploadField({ field, value, onChange }: {
  field: FormFieldType;
  value: string | null; // Changed from File to string (URL)
  onChange: (url: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    // Validate file size
    if (field.validation?.maxSize && file.size > field.validation.maxSize) {
      setUploadError(`El archivo es demasiado grande. Máximo: ${field.validation.maxSize / 1024 / 1024}MB`);
      return;
    }

    // Validate file type
    if (field.validation?.allowedTypes && !field.validation.allowedTypes.includes(file.type)) {
      setUploadError(`Tipo de archivo no permitido. Permitidos: ${field.validation.allowedTypes.join(', ')}`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload file automatically
    try {
      setUploading(true);
      setUploadError(null);
      setFileName(file.name);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }

      const data = await response.json();

      // Store the URL instead of the File object
      onChange(data.fileUrl);
      setFileName(data.fileName);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      onChange(null);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setFileName(null);
    setUploadError(null);
  };

  return (
    <div>
      <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
        <label
          htmlFor={`file-${field.name}`}
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary mb-2 animate-spin" />
              <p className="text-sm text-primary">Subiendo archivo...</p>
            </>
          ) : value ? (
            <>
              <Upload className="h-10 w-10 text-green-600 mb-2" />
              <p className="text-sm text-green-600 font-medium">
                {fileName || 'Archivo subido'}
              </p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-muted-foreground hover:text-destructive mt-2"
              >
                Eliminar
              </button>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click para subir archivo
              </p>
              {field.validation?.maxSize && (
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {field.validation.maxSize / 1024 / 1024}MB
                </p>
              )}
            </>
          )}
        </label>
        <input
          id={`file-${field.name}`}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept={field.validation?.allowedTypes?.join(',')}
          disabled={uploading}
        />
      </div>

      {uploadError && (
        <p className="text-sm text-destructive mt-2">{uploadError}</p>
      )}

      {preview && !uploadError && (
        <Card className="mt-4 p-2">
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
        </Card>
      )}
    </div>
  );
}
