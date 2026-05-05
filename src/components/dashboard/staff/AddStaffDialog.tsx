"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogFooter,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogTrigger,
} from "@/components/ui/animated-dialog";
import { Permission } from "@/domain/entities/Permission";
import { PermissionSelector } from "./PermissionSelector";
import { Loader2 } from "lucide-react";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddStaffDialog({ open, onOpenChange, onSuccess }: AddStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    phoneNumber: "",
    permissions: [] as Permission[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          email: "",
          fullName: "",
          password: "",
          phoneNumber: "",
          permissions: [],
        });
      } else {
        const data = await response.json();
        setError(data.error || "Error al crear el miembro del personal");
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
          <AnimatedDialogTitle>Agregar Miembro del Personal</AnimatedDialogTitle>
          <AnimatedDialogDescription>
            Crea un nuevo miembro del personal y asigna sus permisos
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez García"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Teléfono (Opcional)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
              Crear Personal
            </Button>
          </AnimatedDialogFooter>
        </form>
      </AnimatedDialogContent>
    </AnimatedDialog>
  );
}
