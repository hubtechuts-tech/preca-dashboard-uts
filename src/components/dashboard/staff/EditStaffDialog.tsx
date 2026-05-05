"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogFooter,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
} from "@/components/ui/animated-dialog";
import { Permission } from "@/domain/entities/Permission";
import { PermissionSelector } from "./PermissionSelector";
import { Loader2 } from "lucide-react";

interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  permissions: Permission[];
  isActive: boolean;
}

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess: () => void;
}

export function EditStaffDialog({ open, onOpenChange, staff, onSuccess }: EditStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: staff.fullName || "",
    phoneNumber: staff.phoneNumber || "",
    permissions: staff.permissions || [],
    isActive: staff.isActive,
  });

  // Update form when staff prop changes
  useEffect(() => {
    setFormData({
      fullName: staff.fullName || "",
      phoneNumber: staff.phoneNumber || "",
      permissions: staff.permissions || [],
      isActive: staff.isActive,
    });
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Error al actualizar el miembro del personal");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedDialog open={open} onOpenChange={onOpenChange}>
      <AnimatedDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatedDialogHeader>
          <AnimatedDialogTitle>Editar Miembro del Personal</AnimatedDialogTitle>
          <AnimatedDialogDescription>
            Actualiza la información y permisos de {staff.email}
          </AnimatedDialogDescription>
        </AnimatedDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (No editable)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={staff.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Nombre Completo</Label>
                <Input
                  id="edit-fullName"
                  type="text"
                  placeholder="Juan Pérez García"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Teléfono</Label>
                <Input
                  id="edit-phoneNumber"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-isActive">Estado</Label>
                  <p className="text-xs text-muted-foreground">
                    Activa o desactiva el acceso al sistema
                  </p>
                </div>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>Permisos</Label>
              <PermissionSelector
                selectedPermissions={formData.permissions}
                onChange={(permissions) => setFormData({ ...formData, permissions })}
              />
            </div>
          </div>

          <AnimatedDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </AnimatedDialogFooter>
        </form>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}
