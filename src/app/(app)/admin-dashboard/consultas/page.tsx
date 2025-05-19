
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Search, FileDown, History, Loader2, Eye as EyeIcon, UserSquare2 } from "lucide-react"; 
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
    photoDataUri?: string;
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
  const [selectedVisit, setSelectedVisit] = useState<VisitorFromAPI | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);


  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
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
      let data: VisitorFromAPI[] = await response.json();
      // No es necesario convertir fechas aquí si la API las devuelve como string ISO y las formateamos al mostrar
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

  const handleExport = (formatType: "Excel" | "PDF") => {
    toast({
      title: `Exportar a ${formatType} (Simulado)`,
      description: `La funcionalidad de exportar a ${formatType} aún no está implementada. Se exportarían ${searchResults.length} registros.`,
    });
  };

  const handleViewDetails = (visit: VisitorFromAPI) => {
    setSelectedVisit(visit);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (dateString?: string | Date | null, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, includeTime ? "Pp" : "P", { locale: es });
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
          <CardDescription>
            Busque visitas por nombre, documento, empresa o rango de fechas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="search-term">Término de Búsqueda</Label>
              <Input
                id="search-term"
                placeholder="Nombre, documento, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="date-range">Rango de Fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                          {format(dateRange.to, "LLL dd, y", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y", { locale: es })
                      )
                    ) : (
                      <span>Seleccione un rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSearch} className="lg:self-end" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
              Buscar Visitas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle>Resultados de la Búsqueda</CardTitle>
                <CardDescription>Visitas encontradas según los criterios de búsqueda.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("Excel")} disabled={searchResults.length === 0 || isLoading}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport("PDF")} disabled={searchResults.length === 0 || isLoading}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {isLoading ? (
            <div className="mt-4 flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !hasSearched ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
                <p className="text-muted-foreground">Ingrese criterios y presione "Buscar Visitas" para ver resultados.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Persona Visitada</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map(visit => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{`${visit.nombres} ${visit.apellidos}`}</TableCell>
                        <TableCell>{`${visit.tipodocumento} ${visit.numerodocumento}`}</TableCell>
                        <TableCell>{visit.empresaProviene || 'N/A'}</TableCell>
                        <TableCell>{visit.personavisitada?.nombreApellido || 'N/A'}</TableCell>
                        <TableCell>{formatDate(visit.horaentrada)}</TableCell>
                        <TableCell>{formatDate(visit.horasalida) || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={visit.estado === 'activa' ? 'default' : 'secondary'}>
                            {visit.estado === 'activa' ? 'Activa' : 'Finalizada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(visit)}>
                            <EyeIcon className="mr-2 h-4 w-4" /> Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No se encontraron visitas que coincidan con los criterios.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVisit && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Visita</DialogTitle>
              <DialogDescription>
                Información completa de la visita de {selectedVisit.nombres} {selectedVisit.apellidos}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-4">
            <div className="space-y-4 py-2">
              {selectedVisit.photoDataUri && (
                <div className="flex justify-center mb-4">
                  <Image src={selectedVisit.photoDataUri} alt="Foto Visitante" width={128} height={128} className="rounded-md border object-cover aspect-square" data-ai-hint="person portrait" />
                </div>
              )}
              {!selectedVisit.photoDataUri && (
                <div className="flex justify-center mb-4">
                   <UserSquare2 className="w-32 h-32 text-muted-foreground bg-muted p-4 rounded-md border" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong>Nombre Completo:</strong> {selectedVisit.nombres} {selectedVisit.apellidos}</p>
                <p><strong>Documento:</strong> {selectedVisit.tipodocumento} {selectedVisit.numerodocumento}</p>
                <p><strong>Teléfono:</strong> {selectedVisit.telefono || 'N/A'}</p>
                <p><strong>Fecha Nac.:</strong> {formatDate(selectedVisit.fechanacimiento, false)}</p>
                <p><strong>Género:</strong> {selectedVisit.genero || 'N/A'}</p>
                <p><strong>RH:</strong> {selectedVisit.rh || 'N/A'}</p>
                <p><strong>Empresa Origen:</strong> {selectedVisit.empresaProviene || 'N/A'}</p>
                <p><strong>Carnet Empresa:</strong> {selectedVisit.numerocarnet || 'N/A'}</p>
                <p><strong>Placa Vehículo:</strong> {selectedVisit.vehiculoPlaca || 'N/A'}</p>
                <p><strong>Persona Visitada:</strong> {selectedVisit.personavisitada?.nombreApellido || 'N/A'}</p>
                <p><strong>Propósito:</strong> {selectedVisit.purpose}</p>
                <p><strong>Categoría:</strong> {selectedVisit.category || 'N/A'}</p>
                <p><strong>Tipo de Visita:</strong> {selectedVisit.tipovisita || 'N/A'}</p>
                <p><strong>Hora Entrada:</strong> {formatDate(selectedVisit.horaentrada)}</p>
                <p><strong>Hora Salida:</strong> {formatDate(selectedVisit.horasalida) || (selectedVisit.estado === 'activa' ? 'Visita Activa' : 'N/A')}</p>
                <p><strong>Estado:</strong> <Badge variant={selectedVisit.estado === 'activa' ? 'default' : 'secondary'}>{selectedVisit.estado === 'activa' ? 'Activa' : 'Finalizada'}</Badge></p>
                <p><strong>ARL:</strong> {selectedVisit.arl || 'N/A'}</p>
                <p><strong>EPS:</strong> {selectedVisit.eps || 'N/A'}</p>
                <p><strong>Contacto Emergencia:</strong> {selectedVisit.contactoemergencianombre} {selectedVisit.contactoemergenciaapellido}</p>
                <p><strong>Tel. Emergencia:</strong> {selectedVisit.contactoemergenciatelefono}</p>
                <p><strong>Parentesco Emergencia:</strong> {selectedVisit.contactoemergenciaparentesco}</p>
              </div>
            </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
