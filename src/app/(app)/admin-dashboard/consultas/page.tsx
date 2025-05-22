"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { 
    Calendar as CalendarIcon, 
    Search, 
    // FileDown, // Ya no se usa FileDown, se usa Printer
    History, 
    Loader2, 
    Eye as EyeIcon, 
    UserSquare2, 
    ChevronLeft, 
    ChevronRight, 
    Printer 
} from "lucide-react"; 
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from 'react-to-print';
import { VisitorListPrintLayout } from '@/components/visitor/visitor-list-print-layout'; // Asegúrate que la ruta sea correcta

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

export default function ConsultasPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [searchResults, setSearchResults] = useState<VisitorFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedVisitIndex, setSelectedVisitIndex] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const visitDetailRef = useRef<HTMLDivElement>(null);
  const visitorListPrintRef = useRef<HTMLDivElement>(null);

  const selectedVisit = useMemo(() => {
    if (selectedVisitIndex !== null && searchResults[selectedVisitIndex]) {
      return searchResults[selectedVisitIndex];
    }
    return null;
  }, [selectedVisitIndex, searchResults]);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setSelectedVisitIndex(null); 
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (dateRange?.from) queryParams.append('from', dateRange.from.toISOString());
      if (dateRange?.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); 
          queryParams.append('to', toDate.toISOString());
      }
      
      const response = await fetch(`/api/visitantes?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar visitas');
      }
      const data: VisitorFromAPI[] = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
          toast({title: "Sin Resultados", description: "No se encontraron visitas con los criterios seleccionados."})
      } else {
          toast({title: "Búsqueda Completa", description: `Se encontraron ${data.length} visita(s).`})
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de Búsqueda", description: (error as Error).message });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewDetails = (visitId: string) => {
    const index = searchResults.findIndex(v => v.id === visitId);
    if (index !== -1) {
      setSelectedVisitIndex(index);
      setIsDetailDialogOpen(true);
    }
  };

  const handleNavigateDetails = (direction: 'next' | 'prev') => {
    if (selectedVisitIndex === null || searchResults.length === 0) return;
    
    let newIndex = selectedVisitIndex;
    if (direction === 'next') {
      newIndex = (selectedVisitIndex + 1) % searchResults.length;
    } else {
      newIndex = (selectedVisitIndex - 1 + searchResults.length) % searchResults.length;
    }
    setSelectedVisitIndex(newIndex);
  };

  const handlePrintVisitDetail = useReactToPrint({
    content: () => visitDetailRef.current,
    documentTitle: selectedVisit ? `DetalleVisita_${selectedVisit.nombres}_${selectedVisit.apellidos}`.replace(/\s+/g, '_') : 'DetalleVisita',
    pageStyle: "@page { size: A4 portrait; margin: 1cm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .visit-detail-print-area { padding: 0 !important; } }",
    onAfterPrint: () => toast({ title: "Impresión/Exportación a PDF", description: "Documento enviado a impresión o guardado como PDF."})
  });

  const handlePrintVisitorList = useReactToPrint({
    content: () => visitorListPrintRef.current,
    documentTitle: `Lista_Visitantes_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle: `@page { size: A4 portrait; margin: 0.5cm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print-container-wrapper { display: block !important; } }`,
    onAfterPrint: () => toast({ title: "Exportación de Lista a PDF", description: "Lista enviada a impresión o guardada como PDF."})
  });

  const formatDate = (dateString?: string | Date | null, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return format(date, includeTime ? "dd/MM/yyyy HH:mm:ss" : "dd/MM/yyyy", { locale: es });
  };

  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <History className="mr-3 h-8 w-8 text-primary" />
          Consultas de Visitas Pasadas
        </h1>
      </div>
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Busque visitas por nombre, documento, empresa o rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1"><Label htmlFor="search-term">Término de Búsqueda</Label><Input id="search-term" placeholder="Nombre, documento, empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="date-range">Rango de Fechas</Label><Popover><PopoverTrigger asChild><Button id="date-range" variant={"outline"} className={cn("w-full justify-start text-left font-normal",!dateRange && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y", { locale: es })} - {format(dateRange.to, "LLL dd, y", { locale: es })}</>) : (format(dateRange.from, "LLL dd, y", { locale: es }))) : (<span>Seleccione un rango</span>)}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={es}/></PopoverContent></Popover></div>
            <Button onClick={handleSearch} className="lg:self-end" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />} Buscar Visitas</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div><CardTitle>Resultados de la Búsqueda</CardTitle><CardDescription>Visitas encontradas según los criterios de búsqueda.</CardDescription></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintVisitorList} disabled={searchResults.length === 0 || isLoading}>
                <Printer className="mr-2 h-4 w-4" /> Exportar Lista a PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {isLoading ? (<div className="mt-4 flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !hasSearched ? (<div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card"><p className="text-muted-foreground">Ingrese criterios y presione "Buscar Visitas" para ver resultados.</p></div>
          ) : searchResults.length > 0 ? (
            <ScrollArea className="mt-4 flex-grow">
              <Table>
                <TableHeader><TableRow><TableHead>Nombre Completo</TableHead><TableHead>Documento</TableHead><TableHead>Empresa</TableHead><TableHead>Persona Visitada</TableHead><TableHead>Entrada</TableHead><TableHead>Salida</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {searchResults.map(visit => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{`${visit.nombres} ${visit.apellidos}`}</TableCell>
                        <TableCell>{`${visit.tipodocumento} ${visit.numerodocumento}`}</TableCell>
                        <TableCell>{visit.empresaProviene || 'N/A'}</TableCell>
                        <TableCell>{visit.personavisitada?.nombreApellido || 'N/A'}</TableCell>
                        <TableCell>{formatDate(visit.horaentrada)}</TableCell>
                        <TableCell>{formatDate(visit.horasalida) || 'N/A'}</TableCell>
                        <TableCell><Badge variant={visit.estado === 'activa' ? 'default' : 'secondary'}>{visit.estado === 'activa' ? 'Activa' : 'Finalizada'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(visit.id)}>
                            <EyeIcon className="mr-2 h-4 w-4" /> Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card"><p className="text-muted-foreground">No se encontraron visitas que coincidan con los criterios.</p></div>
          )}
        </CardContent>
      </Card>

      <div className="print-container-wrapper" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', zIndex: -1 }}>
        {searchResults.length > 0 && <VisitorListPrintLayout ref={visitorListPrintRef} visitors={searchResults} />}
      </div>

      {selectedVisit && (
        <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setSelectedVisitIndex(null); }}>
          {/* DialogContent ahora es flex flex-col y p-0 para que los hijos controlen padding y scroll */}
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b shrink-0"> {/* shrink-0 para que no crezca */}
              <DialogTitle>Detalles de la Visita</DialogTitle>
              <DialogDescription>
                Información de la visita de {selectedVisit.nombres} {selectedVisit.apellidos}
                 ({selectedVisitIndex !== null && searchResults.length > 0 ? selectedVisitIndex + 1 : ''} de {searchResults.length}).
              </DialogDescription>
            </DialogHeader>
            
            {/* Este div ahora es el contenedor principal del contenido scrolleable */}
            <div ref={visitDetailRef} className="visit-detail-print-area flex-grow overflow-y-auto"> 
                {/* El padding ahora está aquí para el contenido */}
                <div className="p-6 space-y-4"> 
                    {/* Sección de Foto e Info Personal */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-4">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 shrink-0">
                        {selectedVisit.photoFilename ? (
                            <Image 
                                src={`/api/images/visitors/${selectedVisit.photoFilename}`} 
                                alt={`Foto de ${selectedVisit.nombres}`}
                                width={160} height={160}
                                className="rounded-md border object-cover aspect-square"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-user.png'; }}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center border">
                                <UserSquare2 className="w-24 h-24 text-muted-foreground" />
                            </div>
                        )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm flex-grow w-full">
                            <div><Label className="font-semibold text-muted-foreground">Nombre:</Label> <p className="font-medium">{selectedVisit.nombres} {selectedVisit.apellidos}</p></div>
                            <div><Label className="font-semibold text-muted-foreground">Documento:</Label> <p>{selectedVisit.tipodocumento} {selectedVisit.numerodocumento}</p></div>
                            <div><Label className="font-semibold text-muted-foreground">Teléfono:</Label> <p>{selectedVisit.telefono || 'N/A'}</p></div>
                            <div><Label className="font-semibold text-muted-foreground">F. Nacimiento:</Label> <p>{formatDate(selectedVisit.fechanacimiento, false)}</p></div>
                            <div><Label className="font-semibold text-muted-foreground">Género:</Label> <p>{selectedVisit.genero || 'N/A'}</p></div>
                            <div><Label className="font-semibold text-muted-foreground">RH:</Label> <p>{selectedVisit.rh || 'N/A'}</p></div>
                        </div>
                    </div>
                    {/* Cards de Información (sin cambios en su estructura interna) */}
                    <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-md">Información de la Visita</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs p-3"><div><Label className="font-semibold text-muted-foreground">Persona Visitada:</Label> <p>{selectedVisit.personavisitada?.nombreApellido || 'N/A'}</p></div><div><Label className="font-semibold text-muted-foreground">Tipo de Visita:</Label> <p>{selectedVisit.tipovisita || 'N/A'}</p></div><div className="sm:col-span-2"><Label className="font-semibold text-muted-foreground">Propósito:</Label> <p className="whitespace-pre-wrap text-sm">{selectedVisit.purpose}</p></div><div><Label className="font-semibold text-muted-foreground">Categoría IA:</Label> <p>{selectedVisit.category || 'N/A'}</p></div><div><Label className="font-semibold text-muted-foreground">Hora Entrada:</Label> <p>{formatDate(selectedVisit.horaentrada)}</p></div><div><Label className="font-semibold text-muted-foreground">Hora Salida:</Label> <p>{formatDate(selectedVisit.horasalida) || (selectedVisit.estado === 'activa' ? <Badge variant="outline" className="text-xs">Visita Activa</Badge> : 'N/A')}</p></div><div><Label className="font-semibold text-muted-foreground">Estado:</Label> <p><Badge variant={selectedVisit.estado === 'activa' ? 'default' : 'secondary'} className="text-xs">{selectedVisit.estado === 'activa' ? 'Activa' : 'Finalizada'}</Badge></p></div></CardContent></Card>
                    <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-md">Información Adicional</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs p-3"><div><Label className="font-semibold text-muted-foreground">Empresa Origen:</Label> <p>{selectedVisit.empresaProviene || 'N/A'}</p></div><div><Label className="font-semibold text-muted-foreground">ID Interno:</Label> <p>{selectedVisit.numerocarnet || 'N/A'}</p></div><div><Label className="font-semibold text-muted-foreground">Placa Vehículo:</Label> <p>{selectedVisit.vehiculoPlaca || 'N/A'}</p></div></CardContent></Card>
                    <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-md">Salud y Seguridad</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs p-3"><div><Label className="font-semibold text-muted-foreground">ARL:</Label> <p>{selectedVisit.arl || 'N/A'}</p></div><div><Label className="font-semibold text-muted-foreground">EPS:</Label> <p>{selectedVisit.eps || 'N/A'}</p></div></CardContent></Card>
                    <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-md">Contacto de Emergencia</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs p-3"><div><Label className="font-semibold text-muted-foreground">Nombre:</Label> <p>{selectedVisit.contactoemergencianombre} {selectedVisit.contactoemergenciaapellido}</p></div><div><Label className="font-semibold text-muted-foreground">Teléfono:</Label> <p>{selectedVisit.contactoemergenciatelefono}</p></div><div><Label className="font-semibold text-muted-foreground">Parentesco:</Label> <p>{selectedVisit.contactoemergenciaparentesco}</p></div></CardContent></Card>
                </div>
            </div>

            {/* El DialogFooter ahora está fuera del div scrolleable y no es sticky por sí mismo */}
            <DialogFooter className="p-6 pt-4 border-t shrink-0 flex-col sm:flex-row sm:justify-between gap-2"> {/* shrink-0 */}
                <div className="flex gap-2 justify-center sm:justify-start">
                    <Button type="button" variant="outline" onClick={() => handleNavigateDetails('prev')} disabled={searchResults.length <= 1 || selectedVisitIndex === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</Button>
                    <Button type="button" variant="outline" onClick={() => handleNavigateDetails('next')} disabled={searchResults.length <= 1 || selectedVisitIndex === (searchResults.length - 1)} >Siguiente <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
                <div className="flex gap-2 justify-center sm:justify-end mt-2 sm:mt-0">
                    <Button type="button" variant="outline" onClick={handlePrintVisitDetail}><Printer className="mr-2 h-4 w-4"/> Imprimir/PDF</Button>
                    <DialogClose asChild><Button type="button">Cerrar</Button></DialogClose>
                </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}