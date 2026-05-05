"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogFooter,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
} from '@/components/ui/animated-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Service {
  id: number;
  name: string;
  code: string;
}

export function CreateCouponDialog({ open, onOpenChange, onSuccess }: CreateCouponDialogProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: '',
    appliesToServices: [] as number[],
    description: '',
    organizationName: '',
    notes: '',
    maxRedemptions: '',
    expiresAt: '',
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Error al cargar servicios');
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    if (open) {
      fetchServices();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        appliesToServices: formData.appliesToServices,
        description: formData.description.trim() || null,
        organizationName: formData.organizationName.trim() || null,
        notes: formData.notes.trim() || null,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear cupón');
      }

      toast.success(`El cupón ${payload.code} ha sido creado exitosamente`);

      // Reset form
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        appliesToServices: [],
        description: '',
        organizationName: '',
        notes: '',
        maxRedemptions: '',
        expiresAt: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      appliesToServices: prev.appliesToServices.includes(serviceId)
        ? prev.appliesToServices.filter(id => id !== serviceId)
        : [...prev.appliesToServices, serviceId],
    }));
  };

  return (
    <AnimatedDialog open={open} onOpenChange={onOpenChange}>
      <AnimatedDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>Crear Nuevo Cupón</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Crea un cupón de descuento que se sincronizará con Stripe
            </AnimatedDialogDescription>
          </AnimatedDialogHeader>

          <div className="space-y-4 py-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Código del Cupón <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="ej: ORGABC20OFF"
                value={formData.code}
                onChange={(e) => {
                  // Convert to uppercase and remove spaces and special characters
                  const sanitized = e.target.value
                    .replace(/[^A-Za-z0-9]/g, '') // Only letters and numbers
                    .toUpperCase(); // Convert to uppercase
                  setFormData({ ...formData, code: sanitized });
                }}
                required
                maxLength={50}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Solo letras y números, automáticamente en mayúsculas (3-50 caracteres)
              </p>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">
                  Tipo de Descuento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'percentage' | 'fixed_amount') =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed_amount">Monto Fijo (MXN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Valor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Services Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Servicios Aplicables <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecciona los servicios donde se puede usar este cupón
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.appliesToServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {service.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {service.code}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
                {formData.appliesToServices.length === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    Debes seleccionar al menos un servicio
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de la Organización</Label>
              <Input
                id="organizationName"
                placeholder="ej: ABC Corporation"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="ej: Descuento para miembros de ABC"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Max Redemptions & Expiration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRedemptions">Usos Máximos</Label>
                <Input
                  id="maxRedemptions"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={formData.maxRedemptions}
                  onChange={(e) => setFormData({ ...formData, maxRedemptions: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deja en blanco para ilimitado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Fecha de Expiración</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deja en blanco para sin expiración
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Notas para el equipo administrativo..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <AnimatedDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.appliesToServices.length === 0}
            >
              {loading ? 'Creando...' : 'Crear Cupón'}
            </Button>
          </AnimatedDialogFooter>
        </form>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}
