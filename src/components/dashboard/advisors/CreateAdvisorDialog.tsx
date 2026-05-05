"use client";

import { useState } from 'react';
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

interface CreateAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAdvisorDialog({ open, onOpenChange, onSuccess }: CreateAdvisorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
      };

      const response = await fetch('/api/admin/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear asesor');
      }

      toast.success(`El asesor ${payload.name} ha sido creado exitosamente`);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
      });

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
            <AnimatedDialogTitle>Crear Nuevo Asesor</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Registra un nuevo asesor inmobiliario en el sistema
            </AnimatedDialogDescription>
          </AnimatedDialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                minLength={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Nombre completo del asesor inmobiliario
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
              {loading ? 'Creando...' : 'Crear Asesor'}
            </Button>
          </AnimatedDialogFooter>
        </form>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}
