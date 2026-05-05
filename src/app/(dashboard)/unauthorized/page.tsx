/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a page without proper permissions
 */

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>No tienes permisos para acceder a esta página</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Tu cuenta no tiene los permisos necesarios para ver este contenido.
            Si crees que esto es un error, contacta con tu administrador.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
