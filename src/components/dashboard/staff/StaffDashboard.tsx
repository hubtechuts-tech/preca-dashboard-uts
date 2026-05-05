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
  Shield,
  UserPlus,
  UserCheck,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { AddStaffDialog } from "./AddStaffDialog";
import { EditStaffDialog } from "./EditStaffDialog";
import { Permission } from "@/domain/entities/Permission";

interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  role: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function StaffDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        console.error("Failed to fetch staff");
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;

    const term = searchTerm.toLowerCase();
    return staff.filter(
      (member) =>
        (member.fullName?.toLowerCase().includes(term) || false) ||
        member.email.toLowerCase().includes(term)
    );
  }, [staff, searchTerm]);

  const stats = useMemo(
    () => ({
      totalStaff: staff.length,
      activeStaff: staff.filter((s) => s.isActive).length,
      inactiveStaff: staff.filter((s) => !s.isActive).length,
    }),
    [staff]
  );

  const handleDelete = async (staffId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este miembro del personal?")) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchStaff();
      } else {
        console.error("Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff member:", error);
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsEditDialogOpen(true);
  };

  const getPermissionCount = (permissions: Permission[]) => {
    return permissions.length;
  };

  const getPermissionsBadge = (permissions: Permission[]) => {
    const count = permissions.length;
    if (count === 0) {
      return <Badge variant="outline" className="text-muted-foreground">Sin permisos</Badge>;
    } else if (count <= 4) {
      return <Badge variant="outline" className="text-amber-700 bg-amber-50">Básico</Badge>;
    } else if (count <= 8) {
      return <Badge variant="outline" className="text-blue-700 bg-blue-50">Avanzado</Badge>;
    } else {
      return <Badge variant="outline" className="text-purple-700 bg-purple-50">Completo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Personal</h2>
          <p className="text-muted-foreground">
            Gestiona los miembros del personal y sus permisos
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar Personal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Miembros del equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaff}</div>
            <p className="text-xs text-muted-foreground">
              Con acceso activo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveStaff}</div>
            <p className="text-xs text-muted-foreground">
              Sin acceso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No se encontraron miembros del personal</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.fullName || "Sin nombre"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPermissionsBadge(member.permissions)}
                        <span className="text-sm text-muted-foreground">
                          {getPermissionCount(member.permissions)} permisos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddStaffDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchStaff}
      />

      {selectedStaff && (
        <EditStaffDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          staff={selectedStaff}
          onSuccess={fetchStaff}
        />
      )}
    </div>
  );
}
