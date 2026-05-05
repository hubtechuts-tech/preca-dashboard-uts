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
import { Copy, Check, AlertTriangle } from "lucide-react";

interface ApiKeyCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
}

export function ApiKeyCreatedDialog({
  open,
  onOpenChange,
  apiKey,
}: ApiKeyCreatedDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>API Key creada exitosamente</DialogTitle>
          <DialogDescription>
            Copia y guarda esta API key en un lugar seguro. No podrás verla nuevamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Importante: Guarda esta clave ahora
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Por razones de seguridad, esta es la única vez que podrás ver la clave completa.
                Guárdala en un lugar seguro como un gestor de contraseñas.
              </p>
            </div>
          </div>

          {/* API Key Display */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Tu nueva API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="api-key"
                value={apiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Usage Example */}
          <div className="space-y-2">
            <Label>Ejemplo de uso</Label>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-xs font-mono">
                curl -H &quot;Authorization: Bearer {apiKey.substring(0, 20)}...&quot; \\<br />
                &nbsp;&nbsp;https://api.preca.com/api/services
              </code>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Entendido, he guardado la clave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
