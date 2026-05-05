"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  User,
} from "lucide-react";

interface AdvisorScreeningSummary {
  id: string;
  serviceId: number;
  serviceName: string;
  status: string;
  applicantName: string;
  applicantEmail: string;
  clientName: string | null;
  clientEmail: string | null;
  paymentAmount: number | null;
  createdAt: string;
  completedAt: string | null;
  reportUrl: string | null;
}

interface AdvisorDetails {
  advisor: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
  };
  totalScreenings: number;
  completedScreenings: number;
  pendingScreenings: number;
  totalRevenue: number;
  lastActivityDate: string | null;
  screenings: AdvisorScreeningSummary[];
}

export default function AdvisorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const advisorId = params.id as string;

  const [advisor, setAdvisor] = useState<AdvisorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvisorDetails();
  }, [advisorId]);

  const fetchAdvisorDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/advisors/${advisorId}/details`);

      if (!response.ok) {
        throw new Error("Failed to fetch advisor details");
      }

      const data = await response.json();
      setAdvisor(data);
    } catch (error) {
      console.error("Error fetching advisor details:", error);
      setError("Error al cargar los detalles del asesor");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: "Pago Pendiente", className: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Pagado", className: "bg-blue-100 text-blue-800" },
      processing_bureau: { label: "Procesando", className: "bg-purple-100 text-purple-800" },
      completed: { label: "Completado", className: "bg-green-100 text-green-800" },
      rejected: { label: "Rechazado", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800"
    };

    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando detalles del asesor...</p>
        </div>
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p className="text-sm text-muted-foreground">{error || "Asesor no encontrado"}</p>
        </div>
      </div>
    );
  }

  const displayName = advisor.advisor.name;
  const initials = advisor.advisor.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Advisor Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-background">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                <Badge variant={advisor.advisor.isActive ? "default" : "secondary"}>
                  {advisor.advisor.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{advisor.advisor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{advisor.advisor.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Asesor desde {new Date(advisor.advisor.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisor.totalScreenings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{advisor.completedScreenings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{advisor.pendingScreenings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${advisor.totalRevenue.toLocaleString("es-MX")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Screenings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Referencias</CardTitle>
        </CardHeader>
        <CardContent>
          {advisor.screenings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin referencias</h3>
              <p className="text-sm text-muted-foreground">
                Este asesor aún no ha referido ninguna solicitud
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Servicio</TableHead>
                    <TableHead className="font-semibold">Solicitante</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisor.screenings.map((screening) => (
                    <TableRow
                      key={screening.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/dashboard/screenings/${screening.id}`)}
                    >
                      <TableCell className="font-medium">{screening.serviceName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{screening.applicantName}</p>
                          <p className="text-sm text-muted-foreground">{screening.applicantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {screening.clientName ? (
                          <div>
                            <p className="font-medium">{screening.clientName}</p>
                            <p className="text-sm text-muted-foreground">{screening.clientEmail}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(screening.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {screening.paymentAmount
                          ? `$${screening.paymentAmount.toLocaleString("es-MX")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(screening.createdAt).toLocaleDateString("es-MX")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
