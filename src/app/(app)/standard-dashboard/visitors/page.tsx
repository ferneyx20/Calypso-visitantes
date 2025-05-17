
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
  type VisitorEntry,
  // Assuming these are the correct named exports now from your schemas file
  TIPO_DOCUMENTO as TIPO_DOCUMENTO_OPTIONS_CONST,
  GENERO as GENERO_OPTIONS_CONST,
  RH as RH_OPTIONS_CONST,
  TIPO_VISITA_OPTIONS as TIPO_VISITA_OPTIONS_CONST,
  ARL_OPTIONS as ARL_OPTIONS_CONST,
  EPS_OPTIONS as EPS_OPTIONS_CONST,
  toWritableArray,
} from "@/app/(app)/admin-dashboard/visitors/schemas";


import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, LogOut, Users, Link as LinkIcon, QrCode } from "lucide-react";
import VisitorRegistrationFormFields from "@/components/visitor/visitor-registration-form-fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


// Simulación de empleados
const SIMULATED_EMPLOYEES = [
  { id: "emp-001", name: "Juan Pérez (Ventas)", identification: "12345678" },
  { id: "emp-002", name: "Ana Gómez (Recepción)", identification: "87654321" },
  { id: "emp-003", name: "Carlos López (TI)", identification: "11223344" },
  { id: "emp-004", name: "Sofía Ramírez (RRHH)", identification: "44332211" },
];


// Debounce function
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

export default function StandardVisitorsPage() {
  const { toast } = useToast();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isAutoregisterDialogOpen, setIsAutoregisterDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [visitorEntries, setVisitorEntries] = useState<VisitorEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Standard users typically cannot manage autoregister feature globally
  const [currentUserCanManageAutoregister, setCurrentUserCanManageAutoregister] = useState(false); 
  const [autoregisterEnabled, setAutoregisterEnabled] = useState(true); // State of if the function of autoregister is active
  const [autoregisterUrl, setAutoregisterUrl] = useState("");

  const [tipoDocumentoOptions, setTipoDocumentoOptions] = useState<string[]>(toWritableArray(TIPO_DOCUMENTO_OPTIONS_CONST));
  const [generoOptions, setGeneroOptions] = useState<string[]>(toWritableArray(GENERO_OPTIONS_CONST));
  const [rhOptions, setRhOptions] = useState<string[]>(toWritableArray(RH_OPTIONS_CONST));
  const [tipoVisitaOptions, setTipoVisitaOptions] = useState<string[]>(toWritableArray(TIPO_VISITA_OPTIONS_CONST));
  const [arlOptions, setArlOptions] = useState<string[]>(toWritableArray(ARL_OPTIONS_CONST));
  const [epsOptions, setEpsOptions] = useState<string[]>(toWritableArray(EPS_OPTIONS_CONST));
  
  const employeeComboboxOptions = useMemo(() => 
    SIMULATED_EMPLOYEES.map(emp => ({
      value: emp.id, // Use a unique ID for value
      label: `${emp.name} (ID: ${emp.identification})`, // Display name and ID
    })), 
  []);

  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorRegistrationSchema),
    defaultValues: {
      personavisitada: "",
      purpose: "",
      category: "",
      tipodocumento: undefined,
      genero: undefined,
      rh: undefined,
      tipovisita: undefined,
      arl: undefined,
      eps: undefined,
      empresaProviene: "",
      numerocarnet: "",
      vehiculoPlaca: "",
      photoDataUri: "",
    },
  });

  const purposeValue = form.watch("purpose");

  useEffect(() => {
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

  const onSubmit: SubmitHandler<VisitorFormData> = async (data) => {
    setIsSubmitting(true);
    // Find the employee label based on the ID stored in personavisitada
    const selectedEmployeeOption = employeeComboboxOptions.find(opt => opt.value === data.personavisitada);
    const personavisitadaLabel = selectedEmployeeOption ? selectedEmployeeOption.label : data.personavisitada;

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEntry: VisitorEntry = {
      ...data,
      personavisitada: personavisitadaLabel, // Store the label for display
      id: `visit-${Date.now()}`,
      horaentrada: new Date(),
      horasalida: null,
      estado: "activa",
      // TODO: In a real app, associate this visit with the current standard user
    };
    setVisitorEntries(prev => [newEntry, ...prev]);

    toast({
      title: "Visita Registrada",
      description: `${data.nombres} ${data.apellidos} ha sido registrado(a).`,
    });
    setIsSubmitting(false);
    setIsRegisterDialogOpen(false);
    form.reset();
    setSuggestedCategory(null);
  };
  
  const handleMarkExit = (visitorId: string) => {
    setVisitorEntries(prev => 
      prev.map(v => 
        v.id === visitorId ? { ...v, horasalida: new Date(), estado: "finalizada" } : v
      )
    );
    const visitor = visitorEntries.find(v => v.id === visitorId);
    toast({
      title: "Salida Registrada",
      description: `Se ha registrado la salida de ${visitor?.nombres} ${visitor?.apellidos}.`
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const activeVisitors = useMemo(() => {
    return visitorEntries.filter(v => v.estado === 'activa');
    // TODO: Filter by current standard user's visits in a real app
  }, [visitorEntries]);

  const filteredActiveVisitors = useMemo(() => {
    if (!searchTerm) return activeVisitors;
    return activeVisitors.filter(
      v =>
        (v.nombres.toLowerCase() + " " + v.apellidos.toLowerCase()).includes(searchTerm) ||
        v.numerodocumento.includes(searchTerm)
    );
  }, [activeVisitors, searchTerm]);

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

          {/* Botón de Autoregistro oculto para el usuario estándar */}
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
          <CardTitle>Visitantes Activos (Mis Registros)</CardTitle>
          <CardDescription>
            Visitantes que has registrado y están actualmente en las instalaciones. Busque por nombre o documento.
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre completo o documento..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {activeVisitors.length === 0 && !searchTerm ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No has registrado visitantes activos.</p>
            </div>
          ) : filteredActiveVisitors.length === 0 && searchTerm ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No se encontraron visitantes activos que coincidan con tu búsqueda.</p>
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
                      <TableCell>{visitor.personavisitada}</TableCell> 
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
