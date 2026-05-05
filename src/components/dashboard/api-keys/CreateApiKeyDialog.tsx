"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from "@/components/ui/animated-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKey: (scopes: string[], expiresAt: Date | null) => Promise<void>;
}

const AVAILABLE_SCOPES = [
  { value: "services:read", label: "Leer servicios" },
  { value: "services:write", label: "Escribir servicios" },
  { value: "screenings:read", label: "Leer screenings" },
  { value: "screenings:write", label: "Escribir screenings" },
  { value: "users:read", label: "Leer usuarios" },
];

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreateKey,
}: CreateApiKeyDialogProps) {
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["services:read"]);
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      // Don't allow removing the last scope
      if (selectedScopes.length > 1) {
        setSelectedScopes(selectedScopes.filter((s) => s !== scope));
      }
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      let expiresAt: Date | null = null;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
      }

      await onCreateKey(selectedScopes, expiresAt);

      // Reset form
      setSelectedScopes(["services:read"]);
      setExpiresInDays("");
    } catch (error) {
      console.error("Error creating API key:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setSelectedScopes(["services:read"]);
      setExpiresInDays("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nueva API Key</DialogTitle>
          <DialogDescription>
            Selecciona los permisos y la fecha de expiración para la nueva API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scopes Section */}
          <div className="space-y-2">
            <Label>Permisos (Scopes)</Label>
            <p className="text-sm text-muted-foreground">
              Selecciona al menos un permiso para la API key
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <Badge
                  key={scope.value}
                  variant={selectedScopes.includes(scope.value) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => toggleScope(scope.value)}
                >
                  {scope.label}
                  {selectedScopes.includes(scope.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Expiration Section */}
          <div className="space-y-2">
            <Label htmlFor="expires">Expiración (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="expires"
                type="number"
                min="1"
                placeholder="90"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">días</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dejar vacío para que la clave nunca expire
            </p>
          </div>

          {/* Selected Scopes Summary */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-2">Permisos seleccionados:</p>
            <div className="flex flex-wrap gap-1">
              {selectedScopes.map((scope) => (
                <Badge key={scope} variant="secondary" className="text-xs">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || selectedScopes.length === 0}>
            {creating ? "Creando..." : "Crear API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
