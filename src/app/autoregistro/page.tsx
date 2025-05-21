"use client";

import { useState, useCallback, useEffect } from "react"; // useMemo no se usa aquí
// useForm y SubmitHandler ya no son necesarios aquí, se manejan en VisitorRegistrationForm
// zodResolver y el schema local ya no son necesarios aquí
// Las constantes de schemas ya no se importan aquí para las opciones
import type { FullVisitorFormData } from "@/components/visitor/visitor-registration-form"; // Importar el tipo unificado

import { Button } from "@/components/ui/button";
// Form ya no es necesario aquí
import { useToast } from "@/hooks/use-toast";
import { Loader2, ScanFace } from "lucide-react"; // Removido Building si no se usa
// VisitorRegistrationFormFields ya no se importa/usa directamente aquí
import VisitorRegistrationForm from "@/components/visitor/visitor-registration-form"; // Importar el formulario completo
import Image from "next/image";

// Interfaz para datos de empleado para el combobox
interface EmployeeOption {
  value: string; 
  label: string;
}

// debounce ya no es necesario aquí
// const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => { ... };

export default function AutoregistroPage() {
  const { toast } = useToast();
  // isSubmitting, isCategorizing, suggestedCategory ahora se manejan dentro de VisitorRegistrationForm
  
  // Ya no necesitamos estados locales para las opciones de lista aquí
  // const [tipoDocumentoOptions, setTipoDocumentoOptions] = useState<string[]>(toWritableArray(TIPO_DOCUMENTO));
  // ... y así para las demás listas ...
  
  // Este estado se usa para el combobox de persona visitada, que se pasa a VisitorRegistrationForm
  const [employeeComboboxOptions, setEmployeeComboboxOptions] = useState<EmployeeOption[]>([]);

  // El useForm principal ahora está dentro de VisitorRegistrationForm
  // const form = useForm<VisitorFormData>({ ... });
  // const purposeValue = form.watch("purpose");

  // fetchEmployeesForCombobox se podría mover a VisitorRegistrationForm o mantenerse aquí
  // y pasar las opciones. Por consistencia con la carga de otras listas,
  // VisitorRegistrationForm podría cargar esto también si fuera necesario.
  // Sin embargo, como es un prop específico para el formulario, está bien aquí por ahora.
  const fetchEmployeesForCombobox = async () => {
    try {
      const response = await fetch('/api/empleados?activo=true'); // Solo empleados activos para autoregistro
      if (!response.ok) throw new Error('Error al cargar empleados disponibles');
      const employees: {id: string, nombreApellido: string, identificacion: string}[] = await response.json();
      setEmployeeComboboxOptions(
        employees.map(emp => ({
          value: emp.id,
          label: `${emp.nombreApellido}`, // Simplificado para autoregistro
        }))
      );
    } catch (error) {
      console.error("Error fetching employees for autoregistro:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los empleados anfitriones." });
    }
  };

  useEffect(() => {
    fetchEmployeesForCombobox();
  }, []); // Quitado toast de dependencias si no se usa directamente en este efecto

  // fetchCategorySuggestion y su useEffect ya no son necesarios aquí, están en VisitorRegistrationForm

  const handleAutoregistroSubmitSuccess = (data: FullVisitorFormData) => {
    // Esta función se llamará desde VisitorRegistrationForm cuando el envío sea exitoso
    console.log("Autoregistro enviado:", data);
    // Aquí puedes mostrar un mensaje de "Gracias" más permanente o redirigir a una página de confirmación.
    // Por ahora, el toast ya se muestra desde VisitorRegistrationForm.
    // El reset del formulario también se hace dentro de VisitorRegistrationForm.
  };

  // handleAddOptionToList ya no es necesaria aquí

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      <header className="mb-6 sm:mb-8 text-center">
          <Image
            src="/images/pelican_logo.png" // Asegúrate que esta ruta sea correcta desde public/
            alt="Logo Calypso del Caribe"
            width={100}
            height={100}
            className="mx-auto mb-4 rounded-md"
            priority
          />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary flex items-center justify-center">
          <ScanFace className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8" />
          Autoregistro de Visitantes
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Bienvenido. Por favor, complete el siguiente formulario para registrar su visita.
        </p>
      </header>

      <main className="w-full max-w-3xl"> {/* El formulario completo gestionará el Card y Form */}
        <VisitorRegistrationForm 
            isAutoregistro={true} 
            onSubmitSuccess={handleAutoregistroSubmitSuccess}
            employeeComboboxOptions={employeeComboboxOptions}
        />
      </main>
      <footer className="mt-8 text-center text-xs sm:text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Calypso del Caribe S.A.S. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}