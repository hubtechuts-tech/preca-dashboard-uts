"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, MoreHorizontal, Check, X, Edit2, Trash2, TrendingUp, Award, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateAdvisorDialog } from './CreateAdvisorDialog';
import { EditAdvisorDialog } from './EditAdvisorDialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogFooter,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  useDialogOrigin,
} from '@/components/ui/animated-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Advisor {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdvisorStats {
  advisor: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  totalScreenings: number;
  completedScreenings: number;
  pendingScreenings: number;
  totalRevenue: number;
  lastActivityDate: string | null;
}

export function AdvisorsDashboard() {
  const router = useRouter();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [topAdvisors, setTopAdvisors] = useState<AdvisorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const captureOrigin = useDialogOrigin();

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('activeOnly', filterActive.toString());
      }

      const response = await fetch(`/api/admin/advisors?${params}`);
      if (!response.ok) throw new Error('Error al cargar asesores');

      const data = await response.json();
      setAdvisors(data);
    } catch (error) {
      toast.error('No se pudieron cargar los asesores');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopAdvisors = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/advisors/stats?limit=3');
      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const data = await response.json();
      setTopAdvisors(data);
    } catch (error) {
      console.error('Error fetching top advisors:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
    fetchTopAdvisors();
  }, [filterActive]);

  const handleToggleStatus = async (advisor: Advisor) => {
    try {
      const response = await fetch(`/api/admin/advisors/${advisor.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !advisor.isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado');
      }

      toast.success(
        `Asesor ${advisor.isActive ? 'desactivado' : 'activado'} exitosamente`
      );

      fetchAdvisors();
      fetchTopAdvisors(); // Refresh stats as well
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cambiar el estado del asesor');
    }
  };

  const handleDelete = async () => {
    if (!selectedAdvisor) return;

    try {
      const response = await fetch(`/api/admin/advisors/${selectedAdvisor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar asesor');
      }

      toast.success(`El asesor ${selectedAdvisor.name} ha sido eliminado`);

      fetchAdvisors();
      fetchTopAdvisors(); // Refresh stats as well
      setDeleteDialogOpen(false);
      setSelectedAdvisor(null);
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar el asesor');
    }
  };

  const filteredAdvisors = advisors.filter(
    (advisor) =>
      advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advisor.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Top Advisors Stats */}
      {!statsLoading && topAdvisors.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {topAdvisors.map((stat, index) => (
            <Card
              key={stat.advisor.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/dashboard/advisors/${stat.advisor.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {index === 0 ? "🥇 Top Asesor" : index === 1 ? "🥈 2do Lugar" : "🥉 3er Lugar"}
                </CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold mb-1">{stat.advisor.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{stat.advisor.email}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="font-semibold">{stat.totalScreenings}</span>
                    <span className="text-muted-foreground">precas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="font-semibold text-green-600">
                      ${stat.totalRevenue.toLocaleString("es-MX")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar asesores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterActive(null)}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterActive(true)}>
              Activos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterActive(false)}>
              Inactivos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={(e) => {
          captureOrigin(e);
          setCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Asesor
        </Button>
      </div>

      {/* Advisors Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando asesores...
        </div>
      ) : filteredAdvisors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No se encontraron asesores' : 'No hay asesores registrados'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave de Asesor</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvisors.map((advisor) => (
                <TableRow key={advisor.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{advisor.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/advisors/${advisor.id}`);
                      }}
                    >
                      {advisor.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {advisor.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{advisor.phoneNumber}</div>
                  </TableCell>
                  <TableCell>
                    {advisor.isActive ? (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <X className="h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(advisor.createdAt), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            captureOrigin(e);
                            setSelectedAdvisor(advisor);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(advisor)}
                        >
                          {advisor.isActive ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdvisor(advisor);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Advisor Dialog */}
      <CreateAdvisorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchAdvisors}
      />

      {/* Edit Advisor Dialog */}
      {selectedAdvisor && (
        <EditAdvisorDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          advisor={selectedAdvisor}
          onSuccess={fetchAdvisors}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatedDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AnimatedDialogContent>
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>¿Eliminar asesor?</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Esta acción eliminará permanentemente al asesor <strong>{selectedAdvisor?.name}</strong> del sistema.
              Esta acción no se puede deshacer.
            </AnimatedDialogDescription>
          </AnimatedDialogHeader>
          <AnimatedDialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Eliminar
            </Button>
          </AnimatedDialogFooter>
        </AnimatedDialogContent>
      </AnimatedDialog>
    </div>
  );
}
