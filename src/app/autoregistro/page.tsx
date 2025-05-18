
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/app/(app)/admin-dashboard/visitors/schemas"; 

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ScanFace, Building } from "lucide-react";
import VisitorRegistrationFormFields from "@/components/visitor/visitor-registration-form-fields"; 
import Image from "next/image";

// Interfaz para datos de empleado para el combobox
interface EmployeeOption {
  value: string; // employee ID
  label: string; // "Nombre Apellido (ID: Identificacion)"
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

export default function AutoregistroPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  // Estados para opciones de comboboxes
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
      personavisitada: "", // Esto almacenará el label del combobox de empleado
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
    fetchEmployeesForCombobox();
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(apiPayload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al enviar el registro.");
        }
        
        toast({
            title: "Autoregistro Enviado",
            description: "Su información ha sido enviada. Por favor, espere confirmación en recepción.",
            duration: 5000,
        });
        form.reset();
        setSuggestedCategory(null);
    } catch (error) {
        console.error("Error en autoregistro:", error);
        toast({
            variant: "destructive",
            title: "Error en el Registro",
            description: (error as Error).message || "No se pudo completar su registro. Intente de nuevo.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
          <Image
            src="/images/pelican_logo.png"
            alt="Logo Empresa"
            width={100}
            height={100}
            className="mx-auto mb-4"
            data-ai-hint="pelican logo"
          />
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
          <ScanFace className="mr-3 h-8 w-8" />
          Autoregistro de Visitantes
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete el siguiente formulario para registrar su visita.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-card p-6 sm:p-8 rounded-lg shadow-xl">
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
              showScannerSection={false}
            />
            <div className="mt-8">
              <Button type="submit" className="w-full" disabled={isSubmitting || isCategorizing}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando Registro...
                  </>
                ) : (
                  "Enviar Registro"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Calypso del Caribe. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
