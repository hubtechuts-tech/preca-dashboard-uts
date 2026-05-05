"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Permission, PermissionGroups, RolePermissions } from "@/domain/entities/Permission";
import { Button } from "@/components/ui/button";

interface PermissionSelectorProps {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
}

const permissionLabels: Record<Permission, string> = {
  [Permission.SCREENINGS_READ]: "Ver solicitudes",
  [Permission.SCREENINGS_WRITE]: "Crear/editar solicitudes",
  [Permission.CLIENTS_READ]: "Ver clientes",
  [Permission.CLIENTS_WRITE]: "Editar clientes",
  [Permission.SERVICES_READ]: "Ver servicios",
  [Permission.SERVICES_WRITE]: "Crear/editar servicios",
  [Permission.API_KEYS_READ]: "Ver API keys",
  [Permission.API_KEYS_WRITE]: "Crear/revocar API keys",
  [Permission.USERS_READ]: "Ver personal",
  [Permission.USERS_WRITE]: "Gestionar personal",
  [Permission.COUPONS_READ]: "Ver cupones",
  [Permission.COUPONS_WRITE]: "Gestionar cupones",
  [Permission.ADVISORS_READ]: "Ver asesores",
  [Permission.ADVISORS_WRITE]: "Gestionar asesores",
};

const permissionDescriptions: Record<Permission, string> = {
  [Permission.SCREENINGS_READ]: "Permite visualizar todas las solicitudes de screening",
  [Permission.SCREENINGS_WRITE]: "Permite crear y modificar solicitudes",
  [Permission.CLIENTS_READ]: "Permite ver la lista de clientes y sus detalles",
  [Permission.CLIENTS_WRITE]: "Permite modificar información de clientes",
  [Permission.SERVICES_READ]: "Permite ver el catálogo de servicios",
  [Permission.SERVICES_WRITE]: "Permite crear, editar y eliminar servicios",
  [Permission.API_KEYS_READ]: "Permite ver las API keys existentes",
  [Permission.API_KEYS_WRITE]: "Permite crear y revocar API keys",
  [Permission.USERS_READ]: "Permite ver la lista de miembros del personal",
  [Permission.USERS_WRITE]: "Permite agregar, editar y eliminar personal",
  [Permission.COUPONS_READ]: "Permite ver cupones de descuento",
  [Permission.COUPONS_WRITE]: "Permite crear, editar y eliminar cupones",
  [Permission.ADVISORS_READ]: "Permite ver la lista de asesores inmobiliarios",
  [Permission.ADVISORS_WRITE]: "Permite agregar, editar y eliminar asesores",
};

const permissionCategories: Array<{ name: string; permissions: Permission[] }> = [
  {
    name: "Solicitudes",
    permissions: [...PermissionGroups.SCREENINGS] as Permission[],
  },
  {
    name: "Clientes",
    permissions: [...PermissionGroups.CLIENTS] as Permission[],
  },
  {
    name: "Servicios",
    permissions: [...PermissionGroups.SERVICES] as Permission[],
  },
  {
    name: "Cupones",
    permissions: [...PermissionGroups.COUPONS] as Permission[],
  },
  {
    name: "Asesores",
    permissions: [...PermissionGroups.ADVISORS] as Permission[],
  },
  {
    name: "API Keys",
    permissions: [...PermissionGroups.API_KEYS] as Permission[],
  },
  {
    name: "Personal",
    permissions: [...PermissionGroups.USERS] as Permission[],
  },
];

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const togglePermission = (permission: Permission) => {
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter((p) => p !== permission));
    } else {
      onChange([...selectedPermissions, permission]);
    }
  };

  const applyTemplate = (template: Permission[]) => {
    onChange([...template]);
  };

  const selectAll = () => {
    const allPermissions = Object.values(Permission);
    onChange(allPermissions);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Templates */}
      <div>
        <Label className="text-sm font-medium">Plantillas Rápidas</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyTemplate([...RolePermissions.STAFF_VIEWER])}
            className="gap-2"
          >
            <Badge variant="outline" className="text-amber-700 bg-amber-50">Básico</Badge>
            Ver todo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyTemplate([...RolePermissions.STAFF_MANAGER])}
            className="gap-2"
          >
            <Badge variant="outline" className="text-blue-700 bg-blue-50">Avanzado</Badge>
            Gestor
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyTemplate([...RolePermissions.STAFF_FULL])}
            className="gap-2"
          >
            <Badge variant="outline" className="text-purple-700 bg-purple-50">Completo</Badge>
            Todo excepto API Keys
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
          >
            Ninguno
          </Button>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="space-y-4">
        {permissionCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
              <CardDescription className="text-xs">
                {selectedPermissions.filter((p) => category.permissions.includes(p)).length} de {category.permissions.length} seleccionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.permissions.map((permission) => (
                  <div key={permission} className="flex items-start space-x-3">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <Label
                        htmlFor={permission}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permissionLabels[permission]}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {permissionDescriptions[permission]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
