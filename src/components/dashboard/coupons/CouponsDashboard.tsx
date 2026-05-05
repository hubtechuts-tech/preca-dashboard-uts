"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, MoreHorizontal, Check, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateCouponDialog } from './CreateCouponDialog';
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

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  discountDisplay: string;
  appliesToServices: number[];
  organizationName: string | null;
  description: string | null;
  usageCount: number;
  maxRedemptions: number | null;
  isActive: boolean;
  isValid: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function CouponsDashboard() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const captureOrigin = useDialogOrigin();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }

      const response = await fetch(`/api/admin/coupons?${params}`);
      if (!response.ok) throw new Error('Error al cargar cupones');

      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      toast.error('No se pudieron cargar los cupones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filterActive]);

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar cupón');

      toast.success(`El cupón ${selectedCoupon.code} ha sido eliminado`);

      fetchCoupons();
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
    } catch (error) {
      toast.error('No se pudo eliminar el cupón');
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cupones..."
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
          Nuevo Cupón
        </Button>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando cupones...
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No se encontraron cupones' : 'No hay cupones creados'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div>
                      <div className="font-mono font-semibold">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-xs text-muted-foreground">
                          {coupon.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{coupon.discountDisplay}</Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.organizationName || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.usageCount}
                      {coupon.maxRedemptions && ` / ${coupon.maxRedemptions}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {coupon.isActive ? (
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
                      {!coupon.isValid && coupon.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Expirado/Agotado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.expiresAt ? (
                      <div className="text-sm">
                        {format(new Date(coupon.expiresAt), 'dd MMM yyyy', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin expiración</span>
                    )}
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
                          onClick={() => {
                            setSelectedCoupon(coupon);
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

      {/* Create Coupon Dialog */}
      <CreateCouponDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchCoupons}
      />

      {/* Delete Confirmation Dialog */}
      <AnimatedDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AnimatedDialogContent>
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>¿Eliminar cupón?</AnimatedDialogTitle>
            <AnimatedDialogDescription>
              Esta acción eliminará el cupón <strong>{selectedCoupon?.code}</strong> tanto de la
              base de datos como de Stripe. Los usuarios ya no podrán usar este cupón.
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
