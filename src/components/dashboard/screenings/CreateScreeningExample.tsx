'use client';

/**
 * Example: Create Screening Page with Dynamic Form
 *
 * This component demonstrates how to use the DynamicFormRenderer
 * to create screenings with dynamic forms based on service schemas.
 *
 * Usage in a page:
 * import { CreateScreeningExample } from '@/components/dashboard/screenings/CreateScreeningExample';
 *
 * export default function NewScreeningPage() {
 *   return <CreateScreeningExample />;
 * }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { FormSchema } from '@/domain/value-objects/FormSchema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Info, ExternalLink, CheckCircle, Search, User, Briefcase } from 'lucide-react';

interface Service {
  id: number;
  code: string;
  name: string;
  description: string | null;
  formSchema: any | null;
  hasFormSchema: boolean;
  requiresApplicantDetails?: boolean;  // NEW: Service flag
  targetPersonType?: 'physical' | 'moral';  // NEW: Service target type
}

interface CreatedScreening {
  id: string;
  paymentLinkUrl: string | null;
  status: string;
}

interface ClientSuggestion {
  id: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
}

export function CreateScreeningExample() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Core applicant fields state
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');

  // NEW: Applicant detail fields state
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [applicantPersonType, setApplicantPersonType] = useState<'physical' | 'moral' | ''>('');
  const [applicantLegalRepresentative, setApplicantLegalRepresentative] = useState('');
  const [applicantRFC, setApplicantRFC] = useState('');
  const [applicantStreet, setApplicantStreet] = useState('');
  const [applicantColony, setApplicantColony] = useState('');
  const [applicantMunicipality, setApplicantMunicipality] = useState('');
  const [applicantState, setApplicantState] = useState('');
  const [applicantZipCode, setApplicantZipCode] = useState('');

  // Advisor fields state
  const [advisorId, setAdvisorId] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');

  // Success state
  const [createdScreening, setCreatedScreening] = useState<CreatedScreening | null>(null);

  // Client search autocomplete state
  const [clientSearch, setClientSearch] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Debounced client search
  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setClientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/clients?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setClientSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);

    // Debounce the search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchClients(value);
    }, 300);
  };

  const handleSelectClient = (client: ClientSuggestion) => {
    setApplicantName(client.fullName || '');
    setApplicantEmail(client.email);
    setApplicantPhone(client.phoneNumber || '');
    setSelectedClientId(client.id);
    setShowSuggestions(false);
    setClientSuggestions([]);
    setClientSearch(''); // Clear search field
  };

  const handleClearSelectedClient = () => {
    setSelectedClientId(null);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/services?activeOnly=true');

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceChange = async (serviceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setCreatedScreening(null);

      // Fetch service details with form schema
      const response = await fetch(`/api/services/${serviceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch service details');
      }

      const service = await response.json();
      setSelectedService(service);

      // NEW: Check if service requires applicant details and set person type
      setShowApplicantDetails(service.requiresApplicantDetails || false);
      setApplicantPersonType(service.targetPersonType || '');

      // Convert form schema JSON to FormSchema domain object
      if (service.formSchema) {
        const schema = FormSchema.fromJSON(service.formSchema);
        setFormSchema(schema);
      } else {
        setFormSchema(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!selectedService) {
        throw new Error('Debes seleccionar un servicio');
      }

      if (!applicantName || !applicantEmail) {
        throw new Error('Nombre y correo del solicitante son requeridos');
      }

      // Create screening with form data
      const requestBody: any = {
        serviceId: selectedService.id.toString(), // Ensure string
        applicantName: applicantName,
        applicantEmail: applicantEmail,
        applicantPhone: applicantPhone,
        formData: formData
      };

      // NEW: Add applicant details if required by the service
      if (showApplicantDetails && selectedService?.targetPersonType) {
        requestBody.applicantPersonType = selectedService.targetPersonType;
        requestBody.applicantRFC = applicantRFC;
        requestBody.applicantStreet = applicantStreet;
        requestBody.applicantColony = applicantColony;
        requestBody.applicantMunicipality = applicantMunicipality;
        requestBody.applicantState = applicantState;
        requestBody.applicantZipCode = applicantZipCode;

        if (selectedService.targetPersonType === 'moral') {
          requestBody.applicantLegalRepresentative = applicantLegalRepresentative;
        }
      }

      // Add advisor fields if provided
      if (advisorId) {
        requestBody.advisorId = advisorId;
      } else if (advisorName && advisorPhone) {
        requestBody.advisorName = advisorName;
        requestBody.advisorPhone = advisorPhone;
      }

      const response = await fetch('/api/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create screening');
      }

      const result = await response.json();
      setCreatedScreening(result);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedScreening(null);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
    // NEW: Reset applicant details
    setApplicantLegalRepresentative('');
    setApplicantRFC('');
    setApplicantStreet('');
    setApplicantColony('');
    setApplicantMunicipality('');
    setApplicantState('');
    setApplicantZipCode('');
    setAdvisorId('');
    setAdvisorName('');
    setAdvisorPhone('');
    // Typically we'd also reset the dynamic form here, but handling upstream reset is complex without lifting state up further.
    // For now, simple reset of success state.
  };

  if (createdScreening) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Card className="shadow-lg border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">¡Screening Creado!</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Solicitud <span className="font-mono text-foreground font-medium bg-muted px-2 py-0.5 rounded">{createdScreening.id.split('-')[0]}</span> registrada exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="rounded-xl bg-muted/50 p-5 border border-border/50 space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Siguientes Pasos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  El proceso de investigación iniciará una vez completado el pago. 
                  Comparte el siguiente enlace seguro con tu cliente:
                </p>
              </div>
              
              {createdScreening.paymentLinkUrl ? (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2 relative group">
                    <Input 
                      readOnly 
                      value={createdScreening.paymentLinkUrl} 
                      className="bg-background font-mono text-xs pr-20 h-10 border-input/50 focus-visible:ring-primary/20"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 h-8 px-3 hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => navigator.clipboard.writeText(createdScreening.paymentLinkUrl!)}
                    >
                      Copiar
                    </Button>
                  </div>
                  <Button 
                    className="w-full h-11 text-base shadow-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    onClick={() => window.open(createdScreening.paymentLinkUrl!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ir a Pagar Ahora
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm rounded-lg border border-yellow-500/20 flex items-start gap-3">
                   <AlertCircle className="h-5 w-5 shrink-0" />
                   <p>No se generó enlace de pago automático. Por favor contacta a soporte.</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-2">
            <Button 
                variant="ghost" 
                onClick={handleReset}
                className="text-muted-foreground hover:text-primary transition-colors"
            >
              Crear otro screening
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Screening</CardTitle>
          <CardDescription>
            Selecciona un servicio y completa el formulario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service-select">Servicio *</Label>
            <Select onValueChange={handleServiceChange} disabled={isLoading}>
              <SelectTrigger id="service-select">
                <SelectValue placeholder="Seleccionar servicio..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                    {!service.hasFormSchema && ' (Sin formulario)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Existing Client Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Buscar Cliente Existente</Label>
              {selectedClientId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSelectedClient}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Limpiar selección
                </Button>
              )}
            </div>
            <div className="relative" ref={suggestionRef}>
              <div className="relative">
                <Input
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  placeholder="Buscar por nombre, email o teléfono..."
                  disabled={isLoading || isSubmitting}
                  className="pr-10"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </div>
              </div>
              {/* Autocomplete Dropdown */}
              {showSuggestions && clientSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {clientSuggestions.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.fullName || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      {client.phoneNumber && (
                        <span className="text-xs text-muted-foreground">{client.phoneNumber}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {clientSearch.length > 1 && !isSearching && clientSuggestions.length === 0 && showSuggestions && (
                <p className="text-xs text-muted-foreground mt-1">No se encontraron clientes</p>
              )}
            </div>
            {selectedClientId && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">Cliente seleccionado:</span>
                <span className="text-muted-foreground">{applicantName} ({applicantEmail})</span>
              </div>
            )}
          </div>

          {/* Core Applicant Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="applicant-name">
                Nombre del Solicitante *
              </Label>
              <Input 
                id="applicant-name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                disabled={isLoading || isSubmitting}
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="applicant-email">Correo Electrónico *</Label>
                <Input 
                    id="applicant-email"
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    disabled={isLoading || isSubmitting}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="applicant-phone">Teléfono</Label>
                <Input
                    id="applicant-phone"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+52 ..."
                    disabled={isLoading || isSubmitting}
                />
            </div>
          </div>

          {/* NEW: Applicant Details Section (Conditional) */}
          {showApplicantDetails && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">
                  Detalles del Solicitante ({selectedService?.targetPersonType === 'moral' ? 'Persona Moral' : 'Persona Física'})
                </h3>
                {selectedService?.requiresApplicantDetails && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Requerido
                  </span>
                )}
              </div>

              {/* Legal Representative (only for PM) */}
              {selectedService?.targetPersonType === 'moral' && (
                <div className="space-y-2">
                  <Label htmlFor="legal-rep">Representante Legal *</Label>
                  <Input
                    id="legal-rep"
                    value={applicantLegalRepresentative}
                    onChange={(e) => setApplicantLegalRepresentative(e.target.value)}
                    placeholder="Nombre completo del representante"
                    disabled={isLoading || isSubmitting}
                  />
                </div>
              )}

              {/* RFC Field */}
              <div className="space-y-2">
                <Label htmlFor="rfc">
                  RFC *
                  {selectedService?.targetPersonType && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({selectedService.targetPersonType === 'physical' ? '13' : '12'} caracteres)
                    </span>
                  )}
                </Label>
                <Input
                  id="rfc"
                  value={applicantRFC}
                  onChange={(e) => setApplicantRFC(e.target.value.toUpperCase())}
                  placeholder={selectedService?.targetPersonType === 'physical' ? 'AAAA000000AAA' : 'AAA000000AAA'}
                  maxLength={selectedService?.targetPersonType === 'physical' ? 13 : 12}
                  disabled={isLoading || isSubmitting || !selectedService?.targetPersonType}
                />
              </div>

              {/* Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Calle y Número *</Label>
                  <Input
                    id="street"
                    value={applicantStreet}
                    onChange={(e) => setApplicantStreet(e.target.value)}
                    placeholder="Ej. Calle Principal 123 Int. 4"
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colony">Colonia *</Label>
                  <Input
                    id="colony"
                    value={applicantColony}
                    onChange={(e) => setApplicantColony(e.target.value)}
                    placeholder="Ej. Centro"
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipio *</Label>
                  <Input
                    id="municipality"
                    value={applicantMunicipality}
                    onChange={(e) => setApplicantMunicipality(e.target.value)}
                    placeholder="Ej. Guadalajara"
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={applicantState}
                    onChange={(e) => setApplicantState(e.target.value)}
                    placeholder="Ej. Jalisco"
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip-code">Código Postal *</Label>
                  <Input
                    id="zip-code"
                    value={applicantZipCode}
                    onChange={(e) => setApplicantZipCode(e.target.value)}
                    placeholder="00000"
                    maxLength={5}
                    disabled={isLoading || isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advisor Information Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Asesor Inmobiliario (Opcional)</h3>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              Si este cliente fue referido por un asesor inmobiliario, proporciona su información para rastrear bonos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="advisor-id" className="text-xs text-muted-foreground uppercase tracking-wide">
                  ID de Asesor
                </Label>
                <Input
                  id="advisor-id"
                  value={advisorId}
                  onChange={(e) => {
                    setAdvisorId(e.target.value);
                    // Clear name/phone if ID is provided
                    if (e.target.value) {
                      setAdvisorName('');
                      setAdvisorPhone('');
                    }
                  }}
                  placeholder="Ej. 123"
                  disabled={isLoading || isSubmitting}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado si el asesor ya tiene ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisor-name" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Nombre del Asesor
                </Label>
                <Input
                  id="advisor-name"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Ej. María López"
                  disabled={isLoading || isSubmitting || !!advisorId}
                  className="h-9"
                />
                {advisorId && (
                  <p className="text-xs text-muted-foreground">
                    Deshabilitado (se usará el ID)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="advisor-phone" className="text-xs text-muted-foreground uppercase tracking-wide">
                  Teléfono del Asesor
                </Label>
                <Input
                  id="advisor-phone"
                  value={advisorPhone}
                  onChange={(e) => setAdvisorPhone(e.target.value)}
                  placeholder="+52 ..."
                  disabled={isLoading || isSubmitting || !!advisorId}
                  className="h-9"
                />
                {advisorId && (
                  <p className="text-xs text-muted-foreground">
                    Deshabilitado (se usará el ID)
                  </p>
                )}
              </div>
            </div>

            {!advisorId && (advisorName || advisorPhone) && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-medium">Creación automática de asesor</p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    {advisorName && advisorPhone
                      ? 'Se creará o encontrará el asesor automáticamente con nombre y teléfono.'
                      : 'Proporciona tanto el nombre como el teléfono para crear/encontrar el asesor.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-2 p-4 border border-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* No Schema Warning */}
          {selectedService && !formSchema && !isLoading && (
            <div className="flex items-start gap-2 p-4 border border-blue-500 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700">
                Este servicio no tiene un formulario configurado.
                Los datos se recopilarán de forma genérica.
              </p>
            </div>
          )}

          {/* Dynamic Form */}
          {selectedService && formSchema && !isLoading && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Información Adicional (Dinámica)
              </h3>
              <DynamicFormRenderer
                schema={formSchema}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
