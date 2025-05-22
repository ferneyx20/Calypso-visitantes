// src/components/visitor/visitor-list-print-layout.tsx
import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Para consistencia visual
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserSquare2 } from 'lucide-react';

// Reutilizar la interfaz de ConsultasPage o una similar
interface VisitorFromAPI {
    id: string;
    nombres: string;
    apellidos: string;
    numerodocumento: string;
    personavisitada?: { nombreApellido: string };
    horaentrada: string | Date; 
    horasalida?: string | Date | null; 
    purpose: string;
    category?: string;
    tipodocumento: string;
    empresaProviene?: string;
    vehiculoPlaca?: string;
    numerocarnet?: string;
    photoFilename?: string | null;
    telefono?: string;
    fechanacimiento?: string | Date;
    genero?: string;
    rh?: string;
    tipovisita?: string;
    arl?: string;
    eps?: string;
    contactoemergencianombre?: string;
    contactoemergenciaapellido?: string;
    contactoemergenciatelefono?: string;
    contactoemergenciaparentesco?: string;
    estado: 'activa' | 'finalizada';
}

interface VisitorListPrintLayoutProps {
  visitors: VisitorFromAPI[];
}

const formatDateForPrint = (dateString?: string | Date | null, includeTime = true) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Fecha Inválida';
  return format(date, includeTime ? "dd/MM/yyyy HH:mm:ss" : "dd/MM/yyyy", { locale: es });
};

// Usamos React.forwardRef para poder pasar la ref desde useReactToPrint
export const VisitorListPrintLayout = React.forwardRef<HTMLDivElement, VisitorListPrintLayoutProps>(({ visitors }, ref) => {
  if (!visitors || visitors.length === 0) {
    return <div ref={ref}><p>No hay datos para exportar.</p></div>;
  }

  return (
    <div ref={ref} className="print-container p-4"> {/* Añadir padding general para la impresión */}
      {visitors.map((visit, index) => (
        <div key={visit.id} className="page-break print-page-content mb-8 p-2 border border-gray-300 rounded"> {/* Estilo para cada "página" */}
          <h2 className="text-xl font-bold mb-4 text-center">Detalle de Visita #{index + 1}</h2>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="w-32 h-32 shrink-0"> {/* Tamaño reducido para la lista */}
              {visit.photoFilename ? (
                <Image 
                  src={`/api/images/visitors/${visit.photoFilename}`} 
                  alt={`Foto de ${visit.nombres}`}
                  width={128} height={128}
                  className="rounded-md border object-cover aspect-square"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-user.png'; }}
                />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center border">
                  <UserSquare2 className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs flex-grow"> {/* Texto más pequeño */}
                <div><Label className="font-semibold text-gray-600">Nombre:</Label> <p className="font-medium">{visit.nombres} {visit.apellidos}</p></div>
                <div><Label className="font-semibold text-gray-600">Documento:</Label> <p>{visit.tipodocumento} {visit.numerodocumento}</p></div>
                <div><Label className="font-semibold text-gray-600">Teléfono:</Label> <p>{visit.telefono || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">F. Nacimiento:</Label> <p>{formatDateForPrint(visit.fechanacimiento, false)}</p></div>
                <div><Label className="font-semibold text-gray-600">Género:</Label> <p>{visit.genero || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">RH:</Label> <p>{visit.rh || 'N/A'}</p></div>
            </div>
          </div>
          
          <Card className="mb-3">
            <CardHeader className="p-2"><CardTitle className="text-sm">Información de la Visita</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs p-2">
                <div><Label className="font-semibold text-gray-600">Persona Visitada:</Label> <p>{visit.personavisitada?.nombreApellido || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">Tipo de Visita:</Label> <p>{visit.tipovisita || 'N/A'}</p></div>
                <div className="sm:col-span-2"><Label className="font-semibold text-gray-600">Propósito:</Label> <p className="whitespace-pre-wrap text-xs">{visit.purpose}</p></div>
                <div><Label className="font-semibold text-gray-600">Categoría IA:</Label> <p>{visit.category || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">Hora Entrada:</Label> <p>{formatDateForPrint(visit.horaentrada)}</p></div>
                <div><Label className="font-semibold text-gray-600">Hora Salida:</Label> <p>{formatDateForPrint(visit.horasalida) || (visit.estado === 'activa' ? 'Visita Activa' : 'N/A')}</p></div>
                <div><Label className="font-semibold text-gray-600">Estado:</Label> <p><Badge variant={visit.estado === 'activa' ? 'default' : 'secondary'} className="text-xs">{visit.estado === 'activa' ? 'Activa' : 'Finalizada'}</Badge></p></div>
            </CardContent>
          </Card>

          {/* Puedes añadir las otras cards (Info Adicional, Salud, Emergencia) si son necesarias para la lista */}
          <Card className="mb-3">
            <CardHeader className="p-2"><CardTitle className="text-sm">Información Adicional</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs p-2">
                <div><Label className="font-semibold text-gray-600">Empresa Origen:</Label> <p>{visit.empresaProviene || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">ID Interno:</Label> <p>{visit.numerocarnet || 'N/A'}</p></div>
                <div><Label className="font-semibold text-gray-600">Placa Vehículo:</Label> <p>{visit.vehiculoPlaca || 'N/A'}</p></div>
            </CardContent>
          </Card>
          
          {/* ... etc para Salud y Contacto Emergencia ... */}

        </div>
      ))}
       <style jsx global>{`
        @media print {
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-page-content {
            page-break-after: always !important;
            border: none !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
            padding: 1cm !important; /* Márgenes para impresión */
          }
          .print-page-content:last-child {
            page-break-after: auto !important;
          }
          /* Ocultar elementos no deseados en la impresión global */
          body > *:not(.print-container-wrapper) {
            display: none !important;
          }
          .print-container-wrapper > *:not(.print-container) {
             display: none !important;
          }
        }
      `}</style>
    </div>
  );
});

VisitorListPrintLayout.displayName = 'VisitorListPrintLayout'; // Para el DevTools de React