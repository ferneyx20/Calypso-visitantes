
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Search, FileDown, History, Loader2 } from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VisitorFromAPI {
    id: string;
    nombres: string;
    apellidos: string;
    numerodocumento: string;
    personavisitada?: { nombreApellido: string };
    horaentrada: string | Date; // API might return string
    horasalida?: string | Date | null; // API might return string
    purpose: string;
    category?: string;
    tipodocumento: string;
    empresaProviene?: string;
    // Otros campos del visitante si son necesarios para la tabla
}


export default function ConsultasPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [searchResults, setSearchResults] = useState<VisitorFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (dateRange?.from) queryParams.append('from', dateRange.from.toISOString());
      if (dateRange?.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // Incluir todo el día "to"
          queryParams.append('to', toDate.toISOString());
      }
      // queryParams.append('estado', 'finalizada'); // Opcional: buscar solo finalizadas o todas

      const response = await fetch(`/api/visitantes?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar visitas');
      }
      let data: VisitorFromAPI[] = await response.json();
      data = data.map(v => ({
        ...v,
        horaentrada: new Date(v.horaentrada),
        horasalida: v.horasalida ? new Date(v.horasalida) : null
      }));
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
            Busque visitas por nombre, documento, persona visitada o rango de fechas.
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
                    <TableHead>Propósito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map(visit => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">{`${visit.nombres} ${visit.apellidos}`}</TableCell>
                        <TableCell>{`${visit.tipodocumento} ${visit.numerodocumento}`}</TableCell>
                        <TableCell>{visit.empresaProviene || 'N/A'}</TableCell>
                        <TableCell>{visit.personavisitada?.nombreApellido || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(visit.horaentrada), "Pp", {locale: es})}</TableCell>
                        <TableCell>{visit.horasalida ? format(new Date(visit.horasalida), "Pp", {locale: es}) : 'Activa'}</TableCell>
                        <TableCell className="max-w-xs truncate">{visit.purpose}</TableCell>
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
    </div>
  );
}
