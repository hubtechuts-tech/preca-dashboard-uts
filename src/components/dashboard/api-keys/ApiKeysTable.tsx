"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Key, Trash2, XCircle, Copy, Check } from "lucide-react";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import { ApiKeyCreatedDialog } from "./ApiKeyCreatedDialog";
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
  useDialogOrigin,
} from "@/components/ui/animated-dialog";

interface ApiKey {
  id: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export function ApiKeysTable() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyCreatedDialogOpen, setKeyCreatedDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    key: string;
    data: ApiKey;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const captureOrigin = useDialogOrigin();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        console.error("Failed to fetch API keys");
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (scopes: string[], expiresAt: Date | null) => {
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopes, expiresAt }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey({
          key: data.rawKey,
          data: data,
        });
        setKeyCreatedDialogOpen(true);
        setCreateDialogOpen(false);
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Error creating API key");
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const response = await fetch(`/api/api-keys/${id}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      alert("Error revoking API key");
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      const response = await fetch(`/api/api-keys/${keyToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchApiKeys();
        setDeleteConfirmOpen(false);
        setKeyToDelete(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Error deleting API key");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando API keys...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Total: {apiKeys.length} {apiKeys.length === 1 ? "clave" : "claves"}
          </p>
        </div>
        <Button onClick={(e) => { captureOrigin(e); setCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Crear API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
          <Key className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay API keys</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primera API key para comenzar
          </p>
          <Button onClick={(e) => { captureOrigin(e); setCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Crear API Key
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prefijo</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {apiKey.keyPrefix}...
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(apiKey.keyPrefix, apiKey.id)}
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {apiKey.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Revocada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(apiKey.lastUsedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(apiKey.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(apiKey.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apiKey.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeKey(apiKey.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revocar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            captureOrigin(e);
                            setKeyToDelete(apiKey.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4 bg-muted/20">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="bg-card p-4 rounded-lg border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="bg-muted px-2 py-1 rounded">{apiKey.keyPrefix}...</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(apiKey.keyPrefix, apiKey.id)}
                    >
                      {copiedId === apiKey.id ? (
                         <Check className="h-3 w-3 text-green-600" />
                       ) : (
                         <Copy className="h-3 w-3" />
                       )}
                    </Button>
                  </div>
                  {apiKey.isActive ? (
                    <Badge variant="default" className="bg-green-600 text-[10px] px-1.5">
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5">Revocada</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {apiKey.scopes.map((scope) => (
                    <Badge key={scope} variant="outline" className="text-[10px]">
                      {scope}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-dashed">
                  <div>
                    <span className="block mb-0.5">Creada</span>
                    <span className="font-medium text-foreground">{formatDate(apiKey.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block mb-0.5">Último uso</span>
                     <span className="font-medium text-foreground">{formatDate(apiKey.lastUsedAt)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t mt-1">
                   {apiKey.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleRevokeKey(apiKey.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Revocar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                       className="h-8 w-8 p-0 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        captureOrigin(e);
                        setKeyToDelete(apiKey.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateKey={handleCreateKey}
      />

      {newlyCreatedKey && (
        <ApiKeyCreatedDialog
          open={keyCreatedDialogOpen}
          onOpenChange={setKeyCreatedDialogOpen}
          apiKey={newlyCreatedKey.key}
        />
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar API Key?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La API key será eliminada permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
