
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  visitorRegistrationSchema,
  type VisitorFormData,
  type VisitorEntry,
  TIPO_DOCUMENTO,
  GENERO,
  RH,
  TIPO_VISITA_OPTIONS,
  ARL_OPTIONS,
  EPS_OPTIONS,
  toWritableArray,
} from "./schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, Lightbulb, CalendarIcon, LogOut, Users, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export default function VisitorsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [visitorEntries, setVisitorEntries] = useState<VisitorEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [tipoDocumentoOptions, setTipoDocumentoOptions] = useState<string[]>(toWritableArray(TIPO_DOCUMENTO));
  const [generoOptions, setGeneroOptions] = useState<string[]>(toWritableArray(GENERO));
  const [rhOptions, setRhOptions] = useState<string[]>(toWritableArray(RH));
  const [tipoVisitaOptions, setTipoVisitaOptions] = useState<string[]>(toWritableArray(TIPO_VISITA_OPTIONS));
  const [arlOptions, setArlOptions] = useState<string[]>(toWritableArray(ARL_OPTIONS));
  const [epsOptions, setEpsOptions] = useState<string[]>(toWritableArray(EPS_OPTIONS));
  
  // Options for "Persona a Visitar" combobox
  const employeeOptions = useMemo(() => 
    SIMULATED_EMPLOYEES.map(emp => emp.name), 
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
    },
  });

  const purposeValue = form.watch("purpose");

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
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEntry: VisitorEntry = {
      ...data,
      id: `visit-${Date.now()}`,
      horaentrada: new Date(),
      horasalida: null,
      estado: "activa",
    };
    setVisitorEntries(prev => [newEntry, ...prev]);

    toast({
      title: "Visita Registrada",
      description: `${data.nombres} ${data.apellidos} ha sido registrado(a).`,
    });
    setIsSubmitting(false);
    setIsDialogOpen(false);
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
  
  const employeeComboboxOptions = useMemo(() => {
    return SIMULATED_EMPLOYEES.map(emp => ({
      value: emp.id, // Use a unique ID as value
      label: `${emp.name} (ID: ${emp.identification})`, // Display name and ID
    }));
  }, []);


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Gestión de Visitantes
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <ScrollArea className="h-[60vh] p-1 pr-4">
                  <div className="space-y-6 p-2">
                    {/* Información Personal del Visitante */}
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Información Personal del Visitante</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tipodocumento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Documento</FormLabel>
                              <Combobox
                                options={tipoDocumentoOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, tipoDocumentoOptions, setTipoDocumentoOptions)}
                                placeholder="Seleccione o escriba tipo"
                                searchPlaceholder="Buscar o agregar tipo..."
                                emptyMessage="Tipo no encontrado. Puede agregarlo."
                                addButtonLabel="Agregar tipo"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="numerodocumento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Documento</FormLabel>
                              <FormControl><Input placeholder="Ej: 123456789" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nombres"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombres</FormLabel>
                              <FormControl><Input placeholder="Ej: Ana María" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="apellidos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apellidos</FormLabel>
                              <FormControl><Input placeholder="Ej: Pérez Gómez" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="genero"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Género</FormLabel>
                               <Combobox
                                options={generoOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, generoOptions, setGeneroOptions)}
                                placeholder="Seleccione o escriba género"
                                searchPlaceholder="Buscar o agregar género..."
                                emptyMessage="Género no encontrado. Puede agregarlo."
                                addButtonLabel="Agregar género"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fechanacimiento"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="mb-1.5">Fecha de Nacimiento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      disabled={field.disabled}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Seleccione una fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RH</FormLabel>
                              <Combobox
                                options={rhOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, rhOptions, setRhOptions)}
                                placeholder="Seleccione o escriba RH"
                                searchPlaceholder="Buscar o agregar RH..."
                                emptyMessage="RH no encontrado. Puede agregarlo."
                                addButtonLabel="Agregar RH"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telefono"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl><Input type="tel" placeholder="Ej: 3001234567" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Detalles de la Visita */}
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Detalles de la Visita</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="personavisitada"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Persona a Visitar</FormLabel>
                               <Combobox
                                options={employeeComboboxOptions.map(opt => opt.label)} // Use labels for display
                                value={
                                  employeeComboboxOptions.find(opt => opt.label === field.value)?.label || field.value || ""
                                }
                                onChange={(selectedLabel) => {
                                   field.onChange(selectedLabel); // Store the label/name
                                }}
                                placeholder="Buscar empleado por nombre o ID..."
                                searchPlaceholder="Escriba nombre o ID del empleado..."
                                emptyMessage="Empleado no encontrado."
                                // onAddOption not applicable here as we're selecting existing employees
                                disabled={field.disabled}
                                // Custom icon or indicator
                                icon={<UserCheck className="mr-2 h-4 w-4 text-primary" />}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Propósito de la Visita</FormLabel>
                              <FormControl><Textarea placeholder="Ej: Reunión de seguimiento, Entrega de documentos" {...field} rows={3} /></FormControl>
                              {isCategorizing && <FormDescription className="flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sugiriendo categoría...</FormDescription>}
                              {suggestedCategory && !isCategorizing && (
                                <FormDescription className="flex items-center gap-1 pt-1">
                                  <Lightbulb className="h-3 w-3 text-yellow-500" />
                                  <span>Sugerencia:</span>
                                  <Badge variant="secondary" className="cursor-default">{suggestedCategory}</Badge>
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tipovisita"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Visita</FormLabel>
                              <Combobox
                                options={tipoVisitaOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, tipoVisitaOptions, setTipoVisitaOptions)}
                                placeholder="Seleccione o escriba tipo"
                                searchPlaceholder="Buscar o agregar tipo..."
                                emptyMessage="Tipo no encontrado. Puede agregarlo."
                                addButtonLabel="Agregar tipo"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-lg">Información Adicional (Opcional)</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="empresaProviene"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa de Origen</FormLabel>
                              <FormControl><Input placeholder="Ej: Acme Corp" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="numerocarnet"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Carnet/Identificación Empresa</FormLabel>
                              <FormControl><Input placeholder="Ej: E-12345" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vehiculoPlaca"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Placa del Vehículo</FormLabel>
                              <FormControl><Input placeholder="Ej: XYZ123" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-lg">Salud y Seguridad</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="arl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ARL</FormLabel>
                               <Combobox
                                options={arlOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, arlOptions, setArlOptions)}
                                placeholder="Seleccione o escriba ARL"
                                searchPlaceholder="Buscar o agregar ARL..."
                                emptyMessage="ARL no encontrada. Puede agregarla."
                                addButtonLabel="Agregar ARL"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="eps"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>EPS</FormLabel>
                              <Combobox
                                options={epsOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onAddOption={(newOption) => handleAddOptionToList(newOption, epsOptions, setEpsOptions)}
                                placeholder="Seleccione o escriba EPS"
                                searchPlaceholder="Buscar o agregar EPS..."
                                emptyMessage="EPS no encontrada. Puede agregarla."
                                addButtonLabel="Agregar EPS"
                                disabled={field.disabled}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-lg">Contacto de Emergencia</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactoemergencianombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombres</FormLabel>
                              <FormControl><Input placeholder="Ej: Carlos" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactoemergenciaapellido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apellidos</FormLabel>
                              <FormControl><Input placeholder="Ej: Rodríguez" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactoemergenciatelefono"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl><Input type="tel" placeholder="Ej: 3109876543" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactoemergenciaparentesco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parentesco</FormLabel>
                              <FormControl><Input placeholder="Ej: Hermano, Esposa" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
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
      </div>

      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Visitantes Activos</CardTitle>
          <CardDescription>
            Visitantes actualmente en las instalaciones. Busque por nombre o documento.
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
                      <TableCell>{visitor.personavisitada}</TableCell>
                      <TableCell>{format(visitor.horaentrada, "Pp", { locale: es })}</TableCell>
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
