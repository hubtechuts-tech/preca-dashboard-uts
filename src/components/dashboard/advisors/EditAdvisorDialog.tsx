"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogFooter,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
} from '@/components/ui/animated-dialog';

interface Advisor {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisor: Advisor;
  onSuccess: () => void;
}

export function EditAdvisorDialog({ open, onOpenChange, advisor, onSuccess }: EditAdvisorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: advisor.email,
    phoneNumber: advisor.phoneNumber,
  });

  // Update form when advisor changes
  useEffect(() => {
    setFormData({
      email: advisor.email,
      phoneNumber: advisor.phoneNumber,
    });
  }, [advisor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {};

      // Only include fields that changed
      if (formData.email !== advisor.email) {
        payload.email = formData.email.trim().toLowerCase();
      }
      if (formData.phoneNumber !== advisor.phoneNumber) {
        payload.phoneNumber = formData.phoneNumber.trim();
      }

      // If nothing changed, just close the dialog
      if (Object.keys(payload).length === 0) {
        toast.info('No se realizaron cambios');
        onOpenChange(false);
        return;
      }

      const response = await fetch(`/api/admin/advisors/${advisor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar asesor');
      }

      toast.success(`El asesor ${advisor.name} ha sido actualizado exitosamente`);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedDialog open={open} onOpenChange={onOpenChange}>
      <AnimatedDialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>Editar Asesor</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Actualiza la información de contacto de {advisor.name}
            </AnimatedDialogDescription>
          </AnimatedDialogHeader>

          <div className="space-y-4 py-4">
            {/* Name (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre Completo
              </Label>
              <Input
                id="name"
                value={advisor.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El nombre no se puede modificar
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="asesor@inmobiliaria.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Correo electrónico del asesor
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+52 123 456 7890"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
                minLength={10}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Número de teléfono del asesor (10-20 caracteres)
              </p>
            </div>
          </div>

          <AnimatedDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </AnimatedDialogFooter>
        </form>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}
