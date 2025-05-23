"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, type SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { DialogFooter, DialogClose } from "@/components/ui/dialog"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VisitorRegistrationFormFields, type VisitorFormFieldsProps } from "./visitor-registration-form-fields";
import type { ManagedListItem as PrismaManagedListItem, ManagedListType } from "@prisma/client";
// CAMBIO: ScrollArea no se usa aquí directamente, se eliminó el import si no es necesario en este nivel.
// import { ScrollArea } from "@/components/ui/scroll-area"; 
import type { ComboboxOption } from "@/components/ui/combobox"; // Asegurarse que ComboboxOption esté disponible

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) { clearTimeout(timeout); timeout = null; }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

export const baseVisitorSchema = z.object({
  tipodocumento: z.string().min(1, "Tipo de documento es requerido."),
  numerodocumento: z.string().min(1, "Número de documento es requerido.").max(20, "Máximo 20 caracteres."),
  nombres: z.string().min(2, "Nombres son requeridos.").max(100, "Máximo 100 caracteres."),
  apellidos: z.string().min(2, "Apellidos son requeridos.").max(100, "Máximo 100 caracteres."),
  genero: z.string().min(1, "Género es requerido."),
  fechanacimiento: z.date({ required_error: "Fecha de nacimiento es requerida."})
    .refine(date => date <= new Date(), { message: "Fecha de nacimiento no puede ser futura." })
    .refine(date => date >= new Date("1900-01-01"), { message: "Fecha de nacimiento inválida." }),
  rh: z.string().min(1, "Factor RH es requerido."),
  telefono: z.string().min(7, "Teléfono debe tener al menos 7 dígitos.").max(20, "Máximo 20 caracteres.").regex(/^\+?[0-9\s-()]+$/, { message: "Número de teléfono inválido." }),
  photoDataUri: z.string().optional().nullable(),

  // CAMBIO: Añadido sedeId. Asumimos que es requerido para autorregistro.
  // Si puede ser opcional en algunos casos, ajusta la validación (ej. .optional().nullable())
  sedeId: z.string().min(1, "Debe seleccionar una sede."),

  personavisitadaId: z.string().optional().nullable(), 
  purpose: z.string().min(5, "El propósito debe tener al menos 5 caracteres.").max(500, "Máximo 500 caracteres."),
  category: z.string().optional().nullable(),
  tipovisita: z.string().min(1, "Tipo de visita es requerido."),
  
  empresaProviene: z.string().max(100, "Máximo 100 caracteres.").optional().nullable(),
  numerocarnet: z.string().optional().nullable(), 
  vehiculoPlaca: z.string().max(10, "Máximo 10 caracteres.").optional().nullable(),

  arl: z.string().min(1, "ARL es requerida."),
  eps: z.string().min(1, "EPS es requerida."),

  contactoemergencianombre: z.string().min(1, "Nombre del contacto de emergencia es requerido.").max(100, "Máximo 100 caracteres."),
  contactoemergenciaapellido: z.string().min(1, "Apellido del contacto de emergencia es requerido.").max(100, "Máximo 100 caracteres."),
  contactoemergenciatelefono: z.string().min(7, "Teléfono de emergencia debe tener al menos 7 dígitos.").max(20, "Máximo 20 caracteres.").regex(/^\+?[0-9\s-()]+$/, { message: "Teléfono de contacto de emergencia inválido." }),
  contactoemergenciaparentesco: z.string().min(1, "Parentesco del contacto de emergencia es requerido."),
});

export type FullVisitorFormData = z.infer<typeof baseVisitorSchema>;

const REQUIRED_LIST_TYPES: ManagedListType[] = [
  "TIPOS_DE_DOCUMENTO", "GENEROS", "FACTORES_RH", "TIPOS_DE_VISITA",
  "ARLS", "EPSS", "PARENTESCOS_CONTACTO_EMERGENCIA",
];

// idInternoOptions ya no se define/usa aquí, se maneja en VisitorRegistrationFormFields si es local a ese componente.
// const idInternoOptions = Array.from({ length: 20 }, (_, i) => String(i + 1));

export interface VisitorRegistrationFormPassedProps { 
    isAutoregistro?: boolean;
    onSubmitSuccess?: (data: FullVisitorFormData) => void;
    onCancel?: () => void; 
    isInDialogContext?: boolean; 
    employeeComboboxOptions?: ComboboxOption[];
    sedeOptions?: ComboboxOption[]; // CAMBIO: Añadida prop para opciones de sede
}

export default function VisitorRegistrationForm({ 
    isAutoregistro = false,
    onSubmitSuccess,
    onCancel, 
    isInDialogContext = true, 
    employeeComboboxOptions = [],
    sedeOptions = [], // CAMBIO: Recibir sedeOptions, con valor por defecto array vacío
 }: VisitorRegistrationFormPassedProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const [loadedLists, setLoadedLists] = useState<Partial<Record<ManagedListType, PrismaManagedListItem[]>>>({});
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [listLoadingError, setListLoadingError] = useState<string | null>(null);

  const methods = useForm<FullVisitorFormData>({
    resolver: zodResolver(baseVisitorSchema),
    // CAMBIO: Añadir sedeId a defaultValues
    defaultValues: {
        tipodocumento: "",
        numerodocumento: "",
        nombres: "",
        apellidos: "",
        genero: "",
        fechanacimiento: undefined, // O null si prefieres
        rh: "",
        telefono: "",
        photoDataUri: null,
        sedeId: "", // Valor inicial para sedeId
        personavisitadaId: null,
        purpose: "",
        category: null,
        tipovisita: "",
        empresaProviene: "",
        numerocarnet: null, 
        vehiculoPlaca: "",
        arl: "",
        eps: "",
        contactoemergencianombre: "",
        contactoemergenciaapellido: "",
        contactoemergenciatelefono: "",
        contactoemergenciaparentesco: "",
    }
  });
  const { handleSubmit, setValue, watch, reset, formState: { errors } } = methods;
  const purposeValue = watch("purpose");

  useEffect(() => {
    async function fetchAllLists() {
      setIsLoadingLists(true);
      setListLoadingError(null);
      try {
        const listPromises = REQUIRED_LIST_TYPES.map(listType =>
          fetch(`/api/listas-gestionables?listType=${listType}`).then(res => {
            if (!res.ok) {
                return res.json().then(errorData => {
                    throw new Error(errorData.message || `Error cargando ${listType} (Status: ${res.status})`);
                }).catch(() => { // Fallback si res.json() también falla
                    throw new Error(`Error cargando ${listType} (Status: ${res.status}, no se pudo leer el cuerpo del error)`);
                });
            }
            return res.json();
          })
        );
        const results = await Promise.all(listPromises);
        const newLoadedLists: Partial<Record<ManagedListType, PrismaManagedListItem[]>> = {};
        REQUIRED_LIST_TYPES.forEach((listType, index) => {
          newLoadedLists[listType] = results[index];
        });
        setLoadedLists(newLoadedLists);
      } catch (error) {
        console.error("Error fetching lists for form:", error);
        const errorMessage = error instanceof Error ? error.message : "Error cargando opciones de lista.";
        setListLoadingError(errorMessage);
        toast({ variant: "destructive", title: "Error de Carga de Listas", description: errorMessage, duration: 7000 });
      } finally {
        setIsLoadingLists(false);
      }
    }
    fetchAllLists();
  }, [toast]);

  const fetchCategorySuggestion = useCallback(async (purposeText: string) => {
    if (purposeText.trim().length < 10) { 
      setSuggestedCategory(null); setValue("category", null); return;
    }
    setIsCategorizing(true);
    try {
      const response = await fetch("/api/categorize-visit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: purposeText }),
      });
      if (!response.ok) {
        console.warn("Error al obtener la categoría, la API respondió con:", response.status);
        setSuggestedCategory(null); setValue("category", null); return;
      }
      const data = await response.json();
      setSuggestedCategory(data.suggestedCategory);
      if (data.suggestedCategory) { setValue("category", data.suggestedCategory); }
    } catch (error) {
      console.error("Error fetching category:", error);
      setSuggestedCategory(null); setValue("category", null);
    } finally {
      setIsCategorizing(false);
    }
  }, [setValue]);

  const debouncedFetchCategory = useCallback(debounce(fetchCategorySuggestion, 750), [fetchCategorySuggestion]);

  useEffect(() => {
     if (purposeValue) { debouncedFetchCategory(purposeValue); } 
    else { setSuggestedCategory(null); setValue("category", null); }
  }, [purposeValue, debouncedFetchCategory, setValue]);

  const onSubmit: SubmitHandler<FullVisitorFormData> = async (data) => {
    setIsSubmitting(true);
    // Log para verificar que sedeId se está incluyendo con el valor correcto
    console.log("Full Visitor Data to Submit:", data); 
    try {
      // Asegurar que todos los campos opcionales que son strings vacíos se envíen como null
      // y que sedeId (si es opcional y no se llena) también se maneje apropiadamente.
      const payload = {
        ...data,
        sedeId: data.sedeId || null, // CAMBIO: Asegurar que sedeId se envíe correctamente. Si es siempre requerido, no necesita "|| null".
        numerocarnet: data.numerocarnet || null,
        empresaProviene: data.empresaProviene || null,
        vehiculoPlaca: data.vehiculoPlaca || null,
        category: data.category || null,
        photoDataUri: data.photoDataUri || null,
        personavisitadaId: data.personavisitadaId || null,
      };

      const endpoint = isAutoregistro ? '/api/visitantes/autoregister' : '/api/visitantes';
      const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al registrar el visitante.");
      }
      toast({ title: "Registro Exitoso", description: `${data.nombres} ${data.apellidos} ha sido registrado.` });
      reset(); setSuggestedCategory(null);
      if (onSubmitSuccess) { onSubmitSuccess(data); }
    } catch (error) {
        toast({ variant: "destructive", title: "Error de Registro", description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = () => {
    if (suggestedCategory) {
      setValue("category", suggestedCategory, { shouldValidate: true });
      toast({ title: "Categoría Aplicada", description: `Se aplicó la categoría "${suggestedCategory}".`});
    }
  };

  const handleCancelClick = () => {
    reset(); 
    setSuggestedCategory(null);
    if (onCancel) {
      onCancel(); 
    }
  };

   if (isLoadingLists) {
    return (
      <div className="flex-grow flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando opciones del formulario...</p>
      </div>
    );
  }

  if (listLoadingError) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center min-h-[300px] text-destructive p-6">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Error al cargar datos del formulario.</p>
        <p className="text-sm text-center mb-4">{listLoadingError}</p>
        <Button onClick={() => window.location.reload()}>Reintentar Carga</Button>
      </div>
    );
  }
  
  const formFieldsProps: VisitorFormFieldsProps = {
    isAutoregistro,
    showScannerSection: !isAutoregistro, 
    tiposDeDocumentoOptions: loadedLists.TIPOS_DE_DOCUMENTO?.map(item => item.value) || [],
    generosOptions: loadedLists.GENEROS?.map(item => item.value) || [],
    factoresRHOptions: loadedLists.FACTORES_RH?.map(item => item.value) || [],
    tiposDeVisitaOptions: loadedLists.TIPOS_DE_VISITA?.map(item => item.value) || [],
    arlOptions: loadedLists.ARLS?.map(item => item.value) || [],
    epsOptions: loadedLists.EPSS?.map(item => item.value) || [],
    parentescosOptions: loadedLists.PARENTESCOS_CONTACTO_EMERGENCIA?.map(item => item.value) || [],
    employeeComboboxOptions: employeeComboboxOptions,
    sedeOptions: sedeOptions, // CAMBIO: Pasar sedeOptions a VisitorRegistrationFormFields
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow overflow-y-auto p-6 space-y-0"> 
          <div className="space-y-6">
            <VisitorRegistrationFormFields {...formFieldsProps} />
            <Card>
                <CardHeader><CardTitle className="text-lg">Detalles Adicionales de la Visita</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="purpose">Propósito de la Visita</Label>
                        <Textarea
                            id="purpose"
                            {...methods.register("purpose")}
                            placeholder="Ej: Reunión con el departamento de marketing, Entrevista de trabajo, Entrega de paquete"
                            rows={3}
                        />
                        {errors.purpose && <p className="text-sm text-destructive mt-1">{errors.purpose.message}</p>}
                        {isCategorizing && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sugiriendo categoría...
                            </div>
                        )}
                        {suggestedCategory && !isCategorizing && (
                            <div className="mt-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">Sugerencia:</span>
                            <Badge
                                variant="secondary"
                                onClick={handleSuggestionClick}
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                role="button" tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick()}
                            >
                                {suggestedCategory}
                            </Badge>
                            </div>
                        )}
                        </div>
                        {watch("category") && (
                        <div className="space-y-1">
                            <Label htmlFor="categoryDisplay">Categoría Seleccionada</Label>
                            <Input id="categoryDisplay" value={watch("category") || ""} readOnly className="bg-muted/50" />
                        </div>
                        )}
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="p-6 border-t mt-auto bg-background sticky bottom-0"> 
          {isInDialogContext ? (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting || isLoadingLists} onClick={handleCancelClick}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoadingLists}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</> : (isAutoregistro ? "Enviar Autoregistro" : "Registrar Visitante")}
              </Button>
            </DialogFooter>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0">
              <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting || isLoadingLists} className="w-full sm:w-auto">Limpiar Formulario</Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoadingLists}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : (isAutoregistro ? "Enviar Autoregistro" : "Registrar Visitante")}
              </Button>
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}