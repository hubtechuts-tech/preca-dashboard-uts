'use client';

/**
 * Form Schema Editor Dialog
 *
 * Dialog for editing the form schema of a service using the FormSchemaBuilder
 */

import { useState, useEffect } from 'react';
import { FormSchemaBuilder } from './FormSchemaBuilder';
import { FormSchemaJSON } from '@/domain/value-objects/FormSchema';
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from '@/components/ui/animated-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

interface FormSchemaEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: number;
  serviceName: string;
  initialSchema?: FormSchemaJSON | null;
  onSuccess: () => void;
}

export function FormSchemaEditorDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  initialSchema,
  onSuccess,
}: FormSchemaEditorDialogProps) {
  const [schema, setSchema] = useState<FormSchemaJSON>(
    initialSchema || { version: '1.0', fields: [] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset schema when dialog opens with new service
  useEffect(() => {
    if (open) {
      setSchema(initialSchema || { version: '1.0', fields: [] });
      setError(null);
    }
  }, [open, initialSchema]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/services/${serviceId}/schema`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formSchema: schema }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el esquema');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Configurar Formulario: {serviceName}</DialogTitle>
          <DialogDescription>
            Define los campos que se solicitarán cuando se cree un screening para este servicio.
            Arrastra los campos para reordenarlos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden py-2">
          <FormSchemaBuilder
            initialSchema={schema}
            onSchemaChange={setSchema}
          />
        </div>

        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 p-4 border-t shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || schema.fields.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Esquema
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
