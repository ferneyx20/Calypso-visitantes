// src/app/autoregistro/page.tsx
"use client";

import React, { useEffect, useState } from 'react'; // CAMBIO: Re-añadidos useEffect y useState
import VisitorRegistrationForm, { type VisitorRegistrationFormPassedProps } from '@/components/visitor/visitor-registration-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react'; // CAMBIO: Re-añadidos Loader2 y AlertTriangle
import Image from 'next/image';
import type { ComboboxOption } from '@/components/ui/combobox'; // CAMBIO: Re-añadido ComboboxOption

export default function AutoregistroPage() {
  const { toast } = useToast();

  // CAMBIO: Estados para cargar y almacenar las opciones de sedes
  const [sedeOptions, setSedeOptions] = useState<ComboboxOption[]>([]);
  const [isLoadingSedes, setIsLoadingSedes] = useState(true);
  const [loadingSedesError, setLoadingSedesError] = useState<string | null>(null);

  // CAMBIO: useEffect para cargar las sedes desde la API
  useEffect(() => {
    async function fetchSedes() {
      setIsLoadingSedes(true);
      setLoadingSedesError(null);
      console.log("[AutoregistroPage] Iniciando carga de sedes...");
      try {
        const response = await fetch('/api/sedes'); // Asumiendo que este es tu endpoint para sedes
        console.log("[AutoregistroPage] Respuesta API Sedes - Status:", response.status);

        if (!response.ok) {
          let errorData = { message: `Error HTTP: ${response.status}` };
          try {
            errorData = await response.json();
          } catch (e) {
            // No hacer nada si el cuerpo del error no es JSON, el mensaje por defecto ya está puesto
          }
          console.error("[AutoregistroPage] Error API Sedes:", errorData);
          throw new Error(errorData.message || 'Error al cargar la lista de sedes');
        }

        const data: any[] = await response.json(); // Tipar data como any[] temporalmente
        console.log("[AutoregistroPage] Datos crudos de API Sedes:", data);

        if (!Array.isArray(data)) {
          console.error("[AutoregistroPage] La respuesta de API Sedes no es un array:", data);
          throw new Error('Formato de respuesta de sedes inesperado.');
        }
        
        // Mapear los datos de sedes al formato ComboboxOption
        // Asumiendo que cada objeto sede tiene 'id' y 'name' según tu captura
        const options: ComboboxOption[] = data.map((sede) => {
          if (!sede.id || typeof sede.name !== 'string') {
            console.warn("[AutoregistroPage] Sede con estructura inválida:", sede);
            return null; // Para filtrar después si alguna sede no tiene el formato esperado
          }
          return {
            value: sede.id.toString(),
            label: sede.name,
          };
        }).filter(option => option !== null) as ComboboxOption[];
        
        console.log("[AutoregistroPage] Opciones de Sede mapeadas:", options);
        setSedeOptions(options);

      } catch (error) {
        console.error("[AutoregistroPage] Error en fetchSedes:", error);
        const message = error instanceof Error ? error.message : "No se pudieron cargar las sedes.";
        setLoadingSedesError(message);
        toast({
          variant: 'destructive',
          title: 'Error al Cargar Sedes',
          description: message,
        });
      } finally {
        setIsLoadingSedes(false);
        console.log("[AutoregistroPage] Carga de sedes finalizada. isLoadingSedes:", false);
      }
    }

    fetchSedes();
  }, [toast]); // toast es una dependencia estable

  const handleAutoregistroSuccess = () => {
    toast({
      title: "Autoregistro Enviado",
      description: "Tu solicitud de visita ha sido enviada y está pendiente de aprobación. Recibirás una notificación.",
      duration: 7000,
    });
    // Podrías querer resetear el formulario aquí, o la página podría redirigir.
    // Si VisitorRegistrationForm se resetea internamente, no necesitas hacer nada más aquí.
  };

  const formProps: VisitorRegistrationFormPassedProps = {
    isAutoregistro: true,
    onSubmitSuccess: handleAutoregistroSuccess,
    employeeComboboxOptions: [], 
    sedeOptions: sedeOptions, // CAMBIO: Pasar las opciones de sede cargadas
    isInDialogContext: false,
    onCancel: () => { 
        // El console.log para DEBUG es útil aquí.
        console.log("[AutoregistroPage] DEBUG: Formulario de autoregistro limpiado por el usuario.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden" style={{minHeight: 'calc(100vh - 4rem)', maxHeight: 'calc(100vh - 4rem)'}}>
        <CardHeader className="bg-slate-800 text-primary-foreground p-6 rounded-t-lg">
          <div className="flex flex-col items-center space-y-3">
            <Image
              src="/images/pelican_logo.png"
              alt="Logo Empresa"
              width={80}
              height={80}
              className="rounded-full"
            />
            <CardTitle className="text-3xl font-bold text-center">Formulario de Autoregistro de Visitantes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex flex-col overflow-hidden">
          {/* CAMBIO: Renderizado condicional basado en la carga de sedes */}
          {isLoadingSedes && (
            <div className="flex flex-col items-center justify-center min-h-[200px] p-6 flex-grow">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Cargando opciones de sede...</p>
            </div>
          )}
          {!isLoadingSedes && loadingSedesError && (
             <div className="flex-grow flex flex-col justify-center items-center min-h-[200px] text-destructive p-6">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error al Cargar Sedes</p>
                <p className="text-sm text-center mb-4">{loadingSedesError}</p>
                <p className="text-xs text-muted-foreground">Por favor, intente recargar la página o contacte al administrador.</p>
             </div>
          )}
          {!isLoadingSedes && !loadingSedesError && (
            <VisitorRegistrationForm {...formProps} />
          )}
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Pelican. Todos los derechos reservados.</p>
        <p>Plataforma de Gestión de Visitantes</p>
      </footer>
    </div>
  );
}