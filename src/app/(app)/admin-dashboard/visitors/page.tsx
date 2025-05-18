
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QRCode from "qrcode.react";
import {
  visitorRegistrationSchema,
  type VisitorFormData,
  TIPO_DOCUMENTO,
  GENERO,
  RH,
  TIPO_VISITA_OPTIONS,
  ARL_OPTIONS,
  EPS_OPTIONS,
  toWritableArray,
} from "./schemas";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, LogOut, Users, Link as LinkIcon, QrCode, UserPlus, PackageCheck, PackageX } from "lucide-react";
import VisitorRegistrationFormFields from "@/components/visitor/visitor-registration-form-fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/components/layout/app-header"; // Importar el emisor de notificaciones

interface EmployeeOption {
  value: string; 
  label: string; 
}
interface VisitorFromAPI extends VisitorFormData {
    id: string;
    horaentrada: Date | string; 
    horasalida: Date | string | null;
    estado: "activa" | "finalizada";
    personavisitada?: { nombreApellido: string }; 
    createdAt?: Date;
    updatedAt?: Date;
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

export default function VisitorsPage() {
  const { toast } = useToast();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isAutoregisterDialogOpen, setIsAutoregisterDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  
  const [visitorEntries, setVisitorEntries] = useState<VisitorFromAPI[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentUserCanManageAutoregister, setCurrentUserCanManageAutoregister] = useState(true); 
  const [autoregisterEnabled, setAutoregisterEnabled] = useState(true); 
  const [autoregisterUrl, setAutoregisterUrl] = useState("");

  const [tipoDocumentoOptions, setTipoDocumentoOptions] = useState<string[]>(toWritableArray(TIPO_DOCUMENTO));
  const [generoOptions, setGeneroOptions] = useState<string[]>(toWritableArray(GENERO));
  const [rhOptions, setRhOptions] = useState<string[]>(toWritableArray(RH));
  const [tipoVisitaOptions, setTipoVisitaOptions] = useState<string[]>(toWritableArray(TIPO_VISITA_OPTIONS));
  const [arlOptions, setArlOptions] = useState<string[]>(toWritableArray(ARL_OPTIONS));
  const [epsOptions, setEpsOptions] = useState<string[]>(toWritableArray(EPS_OPTIONS));
  
  const [employeeComboboxOptions, setEmployeeComboboxOptions] = useState<EmployeeOption[]>([]);

  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorRegistrationSchema),
    defaultValues: {
      personavisitada: "", 
      purpose: "",
      category: "",
      tipodocumento: undefined,
      numerodocumento: "",
      nombres: "",
      apellidos: "",
      genero: undefined,
      rh: undefined,
      tipovisita: undefined,
      arl: undefined,
      eps: undefined,
      empresaProviene: "",
      numerocarnet: "",
      vehiculoPlaca: "",
      photoDataUri: "",
      telefono: "",
      contactoemergencianombre: "",
      contactoemergenciaapellido: "",
      contactoemergenciatelefono: "",
      contactoemergenciaparentesco: "",
    },
  });

  const purposeValue = form.watch("purpose");

  const fetchActiveVisitors = async () => {
    setIsLoadingVisitors(true);
    try {
      const response = await fetch('/api/visitantes?estado=activa');
      if (!response.ok) throw new Error('Error al cargar visitantes activos');
      let data: VisitorFromAPI[] = await response.json();
      data = data.map(v => ({
        ...v,
        horaentrada: new Date(v.horaentrada), 
        horasalida: v.horasalida ? new Date(v.horasalida) : null
      }));
      setVisitorEntries(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
      setVisitorEntries([]);
    } finally {
      setIsLoadingVisitors(false);
    }
  };

  const fetchEmployeesForCombobox = async () => {
    try {
      const response = await fetch('/api/empleados');
      if (!response.ok) throw new Error('Error al cargar empleados');
      const employees: {id: string, nombreApellido: string, identificacion: string}[] = await response.json();
      setEmployeeComboboxOptions(
        employees.map(emp => ({
          value: emp.id,
          label: `${emp.nombreApellido} (ID: ${emp.identificacion})`,
        }))
      );
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los empleados para el selector." });
    }
  };

  useEffect(() => {
    fetchActiveVisitors();
    fetchEmployeesForCombobox();
    if (typeof window !== 'undefined') {
      setAutoregisterUrl(`${window.location.origin}/autoregistro`);
    }
  }, []);

  const fetchCategorySuggestion = useCallback(async (purposeText: string) => {
    if (purposeText.trim().length < 10) {
      setSuggestedCategory(null);
      form.setValue("category", "");
      return;
    }
    setIsCategorizing(true);
    try {
      const response = await fetch("/api/categorize-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: purposeText }),
      });
      if (!response.ok) throw new Error("Error al obtener la categoría");
      const data = await response.json();
      setSuggestedCategory(data.suggestedCategory);
      if (data.suggestedCategory) {
        form.setValue("category", data.suggestedCategory);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      setSuggestedCategory(null);
      form.setValue("category", "");
    } finally {
      setIsCategorizing(false);
    }
  }, [form]);

  const debouncedFetchCategory = useCallback(debounce(fetchCategorySuggestion, 750), [fetchCategorySuggestion]);

  useEffect(() => {
    if (purposeValue) {
      debouncedFetchCategory(purposeValue);
    } else {
      setSuggestedCategory(null);
      form.setValue("category", "");
    }
  }, [purposeValue, debouncedFetchCategory, form]);

  const onSubmit: SubmitHandler<VisitorFormData> = async (formData) => {
    setIsSubmitting(true);
    
    const selectedEmployee = employeeComboboxOptions.find(opt => opt.label === formData.personavisitada);
    const personavisitadaId = selectedEmployee ? selectedEmployee.value : null;

    const apiPayload = {
      ...formData,
      fechanacimiento: formData.fechanacimiento.toISOString(), 
      personavisitadaId: personavisitadaId,
    };
    // @ts-ignore
    delete apiPayload.personavisitada; 

    try {
      const response = await fetch('/api/visitantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar la visita.");
      }
      
      toast({
        title: "Visita Registrada",
        description: `${formData.nombres} ${formData.apellidos} ha sido registrado(a).`,
      });
      
      notify.new({
        icon: <UserPlus className="h-5 w-5 text-blue-500" />,
        title: "Nuevo Visitante Registrado",
        description: `${formData.nombres} ${formData.apellidos} ha ingresado.`,
        type: 'visitor_in',
        read: false
      });

      fetchActiveVisitors(); 
      setIsRegisterDialogOpen(false);
      form.reset();
      setSuggestedCategory(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error de Registro", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMarkExit = async (visitorId: string) => {
    const visitor = visitorEntries.find(v => v.id === visitorId);
    if (!visitor) return;

    try {
      const response = await fetch(`/api/visitantes/${visitorId}/exit`, { method: 'PUT' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al marcar salida.");
      }
      toast({
        title: "Salida Registrada",
        description: `Se ha registrado la salida de ${visitor.nombres} ${visitor.apellidos}.`
      });

      notify.new({
          icon: <PackageX className="h-5 w-5 text-orange-500" />,
          title: "Salida de Visitante",
          description: `${visitor.nombres} ${visitor.apellidos} ha salido.`,
          type: 'visitor_out',
          read: false
      });

      fetchActiveVisitors(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error al Marcar Salida", description: (error as Error).message });
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

  const handleAddOptionToList = (
    optionValue: string,
    optionsList: string[],
    setOptionsList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (optionValue && !optionsList.some(opt => opt.toLowerCase() === optionValue.toLowerCase())) {
      setOptionsList(prev => [...prev, optionValue]);
    }
  };

  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        <h1 className="text-3xl font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Gestión de Visitantes
        </h1>
        <div className="flex gap-2">
          <Dialog open={isRegisterDialogOpen} onOpenChange={(open) => {
            setIsRegisterDialogOpen(open);
            if (!open) {
              form.reset();
              setSuggestedCategory(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Visita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Visita</DialogTitle>
                <DialogDescription>Complete todos los campos para registrar al visitante.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <VisitorRegistrationFormFields
                    form={form}
                    isCategorizing={isCategorizing}
                    suggestedCategory={suggestedCategory}
                    tipoDocumentoOptions={tipoDocumentoOptions}
                    onAddTipoDocumento={(newOption) => handleAddOptionToList(newOption, tipoDocumentoOptions, setTipoDocumentoOptions)}
                    generoOptions={generoOptions}
                    onAddGenero={(newOption) => handleAddOptionToList(newOption, generoOptions, setGeneroOptions)}
                    rhOptions={rhOptions}
                    onAddRh={(newOption) => handleAddOptionToList(newOption, rhOptions, setRhOptions)}
                    tipoVisitaOptions={tipoVisitaOptions}
                    onAddTipoVisita={(newOption) => handleAddOptionToList(newOption, tipoVisitaOptions, setTipoVisitaOptions)}
                    arlOptions={arlOptions}
                    onAddArl={(newOption) => handleAddOptionToList(newOption, arlOptions, setArlOptions)}
                    epsOptions={epsOptions}
                    onAddEps={(newOption) => handleAddOptionToList(newOption, epsOptions, setEpsOptions)}
                    employeeComboboxOptions={employeeComboboxOptions}
                    showScannerSection={true}
                  />
                  <DialogFooter className="pt-6 pr-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting || isCategorizing}>
                      {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>) : "Guardar Visita"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
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
                        { !autoregisterUrl ? <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /> : null }
                        <p className="text-sm text-muted-foreground">
                          {autoregisterEnabled ? "Generando QR..." : "El autoregistro está desactivado."}
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

      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <CardTitle>Visitantes Activos</CardTitle>
          <CardDescription>
            Visitantes actualmente en las instalaciones. Busque por nombre o documento.
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, documento o persona visitada..."
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
    </div>
  );
}