// src/app/autoregistro/page.tsx
"use client";

import React from 'react'; // useEffect, useState ya no son necesarios aquí para empleados
import VisitorRegistrationForm, { type VisitorRegistrationFormPassedProps } from '@/components/visitor/visitor-registration-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
// Loader2, AlertTriangle ya no son necesarios si no cargamos empleados
import Image from 'next/image';
// ComboboxOption ya no se usa directamente aquí

export default function AutoregistroPage() {
  const { toast } = useToast();

  // Ya no necesitamos cargar employeeOptions aquí para el autorregistro
  // const [employeeOptions, setEmployeeOptions] = useState<ComboboxOption[]>([]);
  // const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  // const [loadingError, setLoadingError] = useState<string | null>(null);

  // El useEffect para fetchEmployees se puede eliminar completamente.

  const handleAutoregistroSuccess = () => {
    toast({
      title: "Autoregistro Enviado",
      description: "Tu solicitud de visita ha sido enviada y está pendiente de aprobación. Recibirás una notificación.",
      duration: 7000,
    });
  };

  const formProps: VisitorRegistrationFormPassedProps = {
    isAutoregistro: true,
    onSubmitSuccess: handleAutoregistroSuccess,
    employeeComboboxOptions: [], // Pasamos un array vacío ya que no se usará en autoregistro
    isInDialogContext: false,
    onCancel: () => { 
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
          {/* Ya no hay estado de carga/error para empleados aquí */}
          <VisitorRegistrationForm {...formProps} />
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Pelican. Todos los derechos reservados.</p>
        <p>Plataforma de Gestión de Visitantes</p>
      </footer>
    </div>
  );
}