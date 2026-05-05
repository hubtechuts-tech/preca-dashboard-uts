"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  DollarSign,
  Activity,
  UserCheck,
  Sparkles,
  UserX,
  Clock,
} from "lucide-react";


interface ClientRaw {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: string;
  totalScreenings: number;
  pendingScreenings: number;
  completedScreenings: number;
  totalSpent: number;
  lastScreeningDate: string | null;
}

type ClientStatus = "active" | "inactive" | "new";

interface Client extends ClientRaw {
  status: ClientStatus;
  displayName: string;
  initials: string;
}

function computeClientFields(raw: ClientRaw): Client {
  let status: ClientStatus = "active";
  if (!raw.isActive) {
    status = "inactive";
  } else if (raw.totalScreenings === 0) {
    status = "new";
  }

  const displayName = raw.fullName || raw.email;
  const initials = raw.fullName
    ? raw.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    : raw.email.substring(0, 2).toUpperCase();

  return { ...raw, status, displayName, initials };
}

export function ClientsDashboard() {
  const [rawClients, setRawClients] = useState<ClientRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setRawClients(data);
      } else {
        console.error("Failed to fetch clients");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Compute client fields and filter
  const clients = useMemo(() => rawClients.map(computeClientFields), [rawClients]);

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.displayName.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [clients, searchTerm]);

  // Calculate aggregate stats
  const stats = useMemo(() => ({
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    newClients: clients.filter((c) => c.status === "new").length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
    totalScreenings: clients.reduce((sum, c) => sum + c.totalScreenings, 0),
  }), [clients]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        <p className="text-muted-foreground">
          Gestiona y visualiza todos tus clientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScreenings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toLocaleString("es-MX")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserX className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron clientes</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Intenta ajustar la búsqueda"
                  : "Aún no hay clientes registrados"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold text-center">Solicitudes</TableHead>
                      <TableHead className="font-semibold text-center">Pendientes</TableHead>
                      <TableHead className="font-semibold text-right">Gastado</TableHead>
                      <TableHead className="font-semibold">Última Solicitud</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/clients/${client.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-sm ring-1 ring-background">
                              {client.initials}
                            </div>
                            <span className="font-medium">{client.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.email}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {client.totalScreenings}
                        </TableCell>
                        <TableCell className="text-center">
                          {client.pendingScreenings > 0 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {client.pendingScreenings}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ${client.totalSpent.toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {client.lastScreeningDate
                            ? new Date(client.lastScreeningDate).toLocaleDateString("es-MX")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 text-left">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="bg-card p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/clients/${client.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-background">
                        {client.initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base leading-tight">{client.displayName}</h3>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-dashed border-border/60 my-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Solicitudes</span>
                      <p className="font-bold text-lg text-foreground">{client.totalScreenings}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ingresos</span>
                      <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">${client.totalSpent.toLocaleString("es-MX")}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{client.lastScreeningDate ? new Date(client.lastScreeningDate).toLocaleDateString() : 'Sin actividad'}</span>
                    </div>
                    {client.pendingScreenings > 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400 font-medium">
                        {client.pendingScreenings} Pendiente{client.pendingScreenings !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
