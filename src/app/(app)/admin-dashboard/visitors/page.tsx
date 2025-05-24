// src/app/(app)/admin-dashboard/visitors/page.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QRCode from "qrcode.react";
import type { FullVisitorFormData } from "@/components/visitor/visitor-registration-form"; 

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, LogOut, Users, Link as LinkIcon, QrCode, UserPlus, UserX, CheckCircle, AlertCircle, Clock } from "lucide-react";
import VisitorRegistrationForm from "@/components/visitor/visitor-registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/components/layout/app-header";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

interface EmployeeOption {
  value: string; 
  label: string; 
}

interface VisitorFromAPI {
    id: string;
    tipodocumento: string;
    numerodocumento: string;
    nombres: string;
    apellidos: string;
    personavisitada?: { id: string; nombreApellido: string }; 
    sede?: { id: string; name: string }; 
    sedeId?: string; 
    horaentrada: Date | string; 
    horasalida: Date | string | null;
    estado: "activa" | "finalizada" | "PENDIENTE_APROBACION"; 
    createdAt?: Date;
    updatedAt?: Date;
}

export default function VisitorsPage() {
  const { toast } = useToast();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isAutoregisterDialogOpen, setIsAutoregisterDialogOpen] = useState(false);
  
  const [visitorEntries, setVisitorEntries] = useState<VisitorFromAPI[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [pendingVisitors, setPendingVisitors] = useState<VisitorFromAPI[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedVisitorForApproval, setSelectedVisitorForApproval] = useState<VisitorFromAPI | null>(null);
  const [selectedHostForApproval, setSelectedHostForApproval] = useState<string | null>(null); // Almacena el ID del anfitrión
  const [isApprovingVisit, setIsApprovingVisit] = useState(false);

  const [currentUserCanManageAutoregister, setCurrentUserCanManageAutoregister] = useState(true); 
  const [autoregisterEnabled, setAutoregisterEnabled] = useState(true); 
  const [autoregisterUrl, setAutoregisterUrl] = useState("");
  
  const [employeeComboboxOptions, setEmployeeComboboxOptions] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployeesOptions, setIsLoadingEmployeesOptions] = useState(true);

  const fetchAllVisitorsData = useCallback(async () => {
    setIsLoadingVisitors(true);
    setIsLoadingPending(true);
    try {
      const activeResponse = await fetch('/api/visitantes?estado=activa');
      if (!activeResponse.ok) {
        const errorText = await activeResponse.text();
        throw new Error(`Error al cargar visitantes activos: ${activeResponse.status} ${errorText}`);
      }
      let activeData: VisitorFromAPI[] = await activeResponse.json();
      activeData = activeData.map(v => ({
        ...v,
        horaentrada: new Date(v.horaentrada), 
        horasalida: v.horasalida ? new Date(v.horasalida) : null
      }));
      setVisitorEntries(activeData);

      const pendingResponse = await fetch('/api/visitantes?estado=PENDIENTE_APROBACION'); 
      if (!pendingResponse.ok) {
        const errorText = await pendingResponse.text();
        throw new Error(`Error al cargar visitantes pendientes: ${pendingResponse.status} ${errorText}`);
      }
      let pendingData: VisitorFromAPI[] = await pendingResponse.json();
      pendingData = pendingData.map(v => ({ 
        ...v, 
        horaentrada: new Date(v.createdAt || v.horaentrada) 
      }));
      setPendingVisitors(pendingData);

    } catch (error) {
      console.error("Error en fetchAllVisitorsData:", error);
      toast({ variant: "destructive", title: "Error de Carga", description: (error as Error).message });
      setVisitorEntries([]);
      setPendingVisitors([]);
    } finally {
      setIsLoadingVisitors(false);
      setIsLoadingPending(false);
    }
  }, [toast]);


  const fetchEmployeesForCombobox = useCallback(async () => { 
    setIsLoadingEmployeesOptions(true);
    try {
      const response = await fetch('/api/empleados?activo=true'); 
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al cargar empleados: ${response.status} ${errorText}`);
      }
      const employees: {id: string, nombreApellido: string, identificacion: string}[] = await response.json();
      setEmployeeComboboxOptions(
        employees.map(emp => ({
          value: emp.id, 
          label: `${emp.nombreApellido} (ID: ${emp.identificacion})`,
        }))
      );
    } catch (error) {
      console.error("Error en fetchEmployeesForCombobox:", error);
      toast({ variant: "destructive", title: "Error de Carga de Empleados", description: (error as Error).message });
      setEmployeeComboboxOptions([]); 
    } finally {
      setIsLoadingEmployeesOptions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllVisitorsData();
    fetchEmployeesForCombobox();
    if (typeof window !== 'undefined') {
      setAutoregisterUrl(`${window.location.origin}/autoregistro`);
    }
  }, [fetchAllVisitorsData, fetchEmployeesForCombobox]);

  const handleFormSubmitSuccess = (data: FullVisitorFormData) => {
    console.log("Visita registrada desde VisitorsPage:", data);
    fetchAllVisitorsData(); 
    setIsRegisterDialogOpen(false);
  };
  
  const handleMarkExit = async (visitorId: string) => { 
    const visitor = visitorEntries.find(v => v.id === visitorId);
    if (!visitor) return;

    try {
      const response = await fetch(`/api/visitantes/${visitorId}/exit`, { method: 'PUT' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error desconocido al marcar salida."}));
        throw new Error(errorData.message || "Error al marcar salida.");
      }
      toast({
        title: "Salida Registrada",
        description: `Se ha registrado la salida de ${visitor.nombres} ${visitor.apellidos}.`
      });

      notify.new({
          icon: <UserX className="h-5 w-5 text-orange-500" />, 
          title: "Salida de Visitante",
          description: `${visitor.nombres} ${visitor.apellidos} ha salido.`,
          type: 'visitor_out',
          read: false
      });

      fetchAllVisitorsData(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error al Marcar Salida", description: (error as Error).message });
    }
  };

  const openApproveModal = (visitor: VisitorFromAPI) => {
    setSelectedVisitorForApproval(visitor);
    setSelectedHostForApproval(null); 
    setIsApproveModalOpen(true);
  };

  // CAMBIO: Lógica de handleConfirmApproval actualizada
  const handleConfirmApproval = async () => {
    if (!selectedVisitorForApproval || !selectedVisitorForApproval.id) {
      toast({ variant: "destructive", title: "Error", description: "No hay visitante seleccionado para aprobar." });
      return;
    }
    if (!selectedHostForApproval) {
      toast({ variant: "destructive", title: "Error de Validación", description: "Debe seleccionar un anfitrión (persona a visitar)." });
      return;
    }

    setIsApprovingVisit(true);
    try {
      // Usar el endpoint creado: PUT /api/visitantes/[visitorId]/approve
      const response = await fetch(`/api/visitantes/${selectedVisitorForApproval.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personavisitadaId: selectedHostForApproval }),
      });

      if (!response.ok) {
        // Intentar obtener un mensaje de error más detallado del backend
        const errorData = await response.json().catch(() => ({ message: `Error del servidor: ${response.status}` }));
        throw new Error(errorData.message || "Error al aprobar la visita.");
      }

      // Si la respuesta es OK, la API debería devolver la visita actualizada
      const approvedVisit: VisitorFromAPI = await response.json();

      toast({ 
        title: "Visita Aprobada", 
        description: `La visita de ${approvedVisit.nombres} ${approvedVisit.apellidos} ha sido aprobada.` 
      });
      
      const hostLabel = employeeComboboxOptions.find(e => e.value === selectedHostForApproval)?.label || 'Anfitrión no especificado';
      notify.new({
          icon: <UserPlus className="h-5 w-5 text-green-500" />, 
          title: "Visita Aprobada",
          description: `Visita de ${approvedVisit.nombres} ${approvedVisit.apellidos} aprobada. Anfitrión: ${hostLabel}.`,
          type: 'visitor_approved',
          read: false
      });

      setIsApproveModalOpen(false);
      setSelectedVisitorForApproval(null);
      setSelectedHostForApproval(null); // Limpiar el anfitrión seleccionado
      fetchAllVisitorsData(); // Recargar ambas listas de visitantes
    } catch (error) {
      console.error("Error en handleConfirmApproval:", error);
      toast({ variant: "destructive", title: "Error de Aprobación", description: (error as Error).message });
    } finally {
      setIsApprovingVisit(false);
    }
  };


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredActiveVisitors = useMemo(() => { 
    if (!searchTerm) return visitorEntries.filter(v => v.estado === 'activa');
    return visitorEntries.filter(
      v => v.estado === 'activa' && (
        (v.nombres.toLowerCase() + " " + v.apellidos.toLowerCase()).includes(searchTerm) ||
        v.numerodocumento.includes(searchTerm) ||
        (v.personavisitada?.nombreApellido || '').toLowerCase().includes(searchTerm)
      )
    );
  }, [visitorEntries, searchTerm]);

  const filteredPendingVisitors = useMemo(() => {
    if (!searchTerm) return pendingVisitors;
    return pendingVisitors.filter(
      v => (
        (v.nombres.toLowerCase() + " " + v.apellidos.toLowerCase()).includes(searchTerm) ||
        v.numerodocumento.includes(searchTerm) ||
        (v.sede?.name || '').toLowerCase().includes(searchTerm) 
      )
    );
  }, [pendingVisitors, searchTerm]);


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <h1 className="text-3xl font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Gestión de Visitantes
        </h1>
        <div className="flex gap-2">
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoadingEmployeesOptions}>
                {isLoadingEmployeesOptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Registrar Visita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0"> 
              <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10"> 
                <DialogTitle>Registrar Nueva Visita</DialogTitle>
                <DialogDescription>
                  Complete todos los campos para registrar al visitante.
                </DialogDescription>
              </DialogHeader>
              {isRegisterDialogOpen && !isLoadingEmployeesOptions && (
                <VisitorRegistrationForm 
                  isAutoregistro={false} 
                  onSubmitSuccess={handleFormSubmitSuccess}
                  employeeComboboxOptions={employeeComboboxOptions} 
                  // sedeOptions no se pasa aquí explícitamente, VisitorRegistrationForm lo manejará con default si es necesario
                />
              )}
              {isLoadingEmployeesOptions && isRegisterDialogOpen && (
                <div className="flex-grow flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                    <p className="ml-2">Cargando datos del formulario...</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

           {currentUserCanManageAutoregister && (
            <Dialog open={isAutoregisterDialogOpen} onOpenChange={setIsAutoregisterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Autoregistro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center"><QrCode className="mr-2 h-5 w-5 text-primary"/> Opciones de Autoregistro</DialogTitle>
                  <DialogDescription>
                    Use el código QR o el enlace para que los visitantes se registren ellos mismos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center">
                    {autoregisterUrl && autoregisterEnabled ? ( 
                      <QRCode value={autoregisterUrl} size={192} level="H" />
                    ) : (
                      <div className="h-48 w-48 flex flex-col items-center justify-center bg-muted rounded-md text-center p-4">
                        { !autoregisterUrl || !autoregisterEnabled && <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />}
                        <p className="text-sm text-muted-foreground">
                          {autoregisterEnabled ? (autoregisterUrl ? "" : "Generando QR...") : "El autoregistro está desactivado."}
                        </p>
                      </div>
                    )}
                  </div>
                  {autoregisterUrl && (
                    <div className="space-y-1 text-center">
                      <Label htmlFor="autoregister-link" className="text-sm font-medium">Enlace de Autoregistro:</Label>
                      <Input
                        id="autoregister-link"
                        type="text"
                        value={autoregisterEnabled ? autoregisterUrl : "Autoregistro desactivado"}
                        readOnly
                        className="text-center"
                        disabled={!autoregisterEnabled}
                      />
                       <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-1" 
                          onClick={() => navigator.clipboard.writeText(autoregisterUrl).then(() => toast({ title: "Enlace copiado" }))}
                          disabled={!autoregisterEnabled || !autoregisterUrl}
                        >
                        Copiar Enlace
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoregister-toggle" className="text-base">
                        Activar Autoregistro
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Permite a los visitantes usar el enlace/QR.
                      </p>
                    </div>
                    <Switch
                      id="autoregister-toggle"
                      checked={autoregisterEnabled}
                      onCheckedChange={setAutoregisterEnabled} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button">Cerrar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Clock className="mr-2 h-6 w-6 text-yellow-500" />Visitas Pendientes de Aprobación</CardTitle>
          <CardDescription>Visitas de autoregistro esperando confirmación y asignación de anfitrión.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isLoadingPending ? (
            <div className="mt-4 flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : filteredPendingVisitors.length === 0 ? (
            <div className="mt-4 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-card p-8">
              <p className="text-muted-foreground">{searchTerm ? "No se encontraron visitas pendientes que coincidan." : "No hay visitas pendientes de aprobación."}</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Sede Solicitada</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{`${visitor.nombres} ${visitor.apellidos}`}</TableCell>
                      <TableCell>{`${visitor.tipodocumento} ${visitor.numerodocumento}`}</TableCell>
                      <TableCell>{visitor.sede?.name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(visitor.horaentrada), "Pp", { locale: es })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" onClick={() => openApproveModal(visitor)}>
                          <CheckCircle className="mr-2 h-4 w-4"/> Aprobar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-lg flex flex-col flex-1 w-full"> 
        <CardHeader>
          <CardTitle>Visitantes Activos</CardTitle>
          <CardDescription>
            Visitantes actualmente en las instalaciones. Busque por nombre o documento.
            <span className="block text-xs text-muted-foreground mt-1">El filtro de búsqueda aplica a ambas tablas (Pendientes y Activos).</span>
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar en todas las visitas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {isLoadingVisitors ? (
            <div className="mt-4 flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ): visitorEntries.filter(v => v.estado === 'activa').length === 0 && !searchTerm ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay visitantes activos registrados.</p>
            </div>
          ) : filteredActiveVisitors.length === 0 && searchTerm ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No se encontraron visitantes activos que coincidan con su búsqueda.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Tipo Doc.</TableHead>
                    <TableHead>Número Doc.</TableHead>
                    <TableHead>Persona Visitada</TableHead>
                    <TableHead>Hora Entrada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{`${visitor.nombres} ${visitor.apellidos}`}</TableCell>
                      <TableCell>{visitor.tipodocumento}</TableCell>
                      <TableCell>{visitor.numerodocumento}</TableCell>
                      <TableCell>{visitor.personavisitada?.nombreApellido || 'N/A'}</TableCell> 
                      <TableCell>{format(new Date(visitor.horaentrada), "Pp", { locale: es })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleMarkExit(visitor.id)}>
                          <LogOut className="mr-2 h-4 w-4"/> Marcar Salida
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVisitorForApproval && (
        <Dialog open={isApproveModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedVisitorForApproval(null);
              setSelectedHostForApproval(null); // Limpiar también el anfitrión seleccionado al cerrar
            }
            setIsApproveModalOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Aprobar Visita y Asignar Anfitrión</DialogTitle>
              <DialogDescription>
                Seleccione el empleado que recibirá a 
                <span className="font-semibold"> {selectedVisitorForApproval.nombres} {selectedVisitorForApproval.apellidos}</span>.
                <br />Sede solicitada: <span className="font-semibold">{selectedVisitorForApproval.sede?.name || 'No especificada'}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="hostEmployee">Anfitrión (Persona a Visitar)</Label>
                <Combobox
                  options={employeeComboboxOptions}
                  value={selectedHostForApproval} // Este es el ID del empleado
                  onChange={(value) => setSelectedHostForApproval(value)}
                  placeholder="Seleccione un empleado..."
                  searchPlaceholder="Buscar empleado..."
                  emptyMessage="Empleado no encontrado."
                  disabled={isLoadingEmployeesOptions || isApprovingVisit}
                  icon={<UserCheck className="mr-2 h-4 w-4"/>}
                />
                {isLoadingEmployeesOptions && <p className="text-xs text-muted-foreground mt-1">Cargando empleados...</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsApproveModalOpen(false)} disabled={isApprovingVisit}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmApproval} 
                disabled={!selectedHostForApproval || isApprovingVisit || isLoadingEmployeesOptions}
              >
                {isApprovingVisit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Aprobación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}