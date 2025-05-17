
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Search, FileDown, History } from "lucide-react"; // Added History

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Simulación de datos de visitas pasadas
interface PastVisitorEntry {
  id: string;
  nombres: string;
  apellidos: string;
  numerodocumento: string;
  personavisitada: string;
  horaentrada: Date;
  horasalida: Date | null;
  purpose: string;
  category?: string;
}

const MOCK_PAST_VISITS: PastVisitorEntry[] = [
  { id: "pv-1", nombres: "Luisa", apellidos: "Fernandez", numerodocumento: "10203040", personavisitada: "Ana Gómez (Recepción)", horaentrada: new Date(2023, 10, 15, 9, 0), horasalida: new Date(2023, 10, 15, 10, 30), purpose: "Entrega de propuesta comercial", category: "Proveedor" },
  { id: "pv-2", nombres: "Pedro", apellidos: "Ramirez", numerodocumento: "50607080", personavisitada: "Carlos López (TI)", horaentrada: new Date(2023, 11, 1, 14, 0), horasalida: new Date(2023, 11, 1, 15, 0), purpose: "Soporte técnico equipo", category: "Contratista" },
  { id: "pv-3", nombres: "Elena", apellidos: "Vargas", numerodocumento: "90102030", personavisitada: "Juan Pérez (Ventas)", horaentrada: new Date(2024, 0, 20, 11, 0), horasalida: null, purpose: "Reunión de seguimiento", category: "Cliente" } // Changed new Date() to a fixed date
];


export default function ConsultasPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<PastVisitorEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // Simulación de búsqueda y filtrado
    setHasSearched(true);
    let results = MOCK_PAST_VISITS;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(
        (visit) =>
          (visit.nombres.toLowerCase() + " " + visit.apellidos.toLowerCase()).includes(lowerSearchTerm) ||
          visit.numerodocumento.includes(lowerSearchTerm) ||
          visit.personavisitada.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (dateRange?.from) {
      results = results.filter((visit) => new Date(visit.horaentrada) >= dateRange.from!);
    }
    if (dateRange?.to) {
      // Adjust 'to' date to include the whole day
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      results = results.filter((visit) => new Date(visit.horaentrada) <= toDate);
    }
    setSearchResults(results);
    if (results.length === 0) {
        toast({title: "Sin Resultados", description: "No se encontraron visitas con los criterios seleccionados."})
    }
  };

  const handleExport = (format: "Excel" | "PDF") => {
    toast({
      title: `Exportar a ${format} (Simulado)`,
      description: `La funcionalidad de exportar a ${format} aún no está implementada.`,
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

      <Card className="shadow-lg">
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
                placeholder="Nombre, documento, persona visitada..."
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

            <Button onClick={handleSearch} className="lg:self-end">
              <Search className="mr-2 h-4 w-4" />
              Buscar Visitas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle>Resultados de la Búsqueda</CardTitle>
                <CardDescription>Visitas encontradas según los criterios de búsqueda.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("Excel")}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport("PDF")}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar a PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          { !hasSearched ? (
             <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
                <p className="text-muted-foreground">Ingrese criterios y presione "Buscar Visitas" para ver resultados.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 overflow-auto">
              {/* Aquí iría la tabla de resultados. Por ahora un placeholder. */}
              <p className="text-sm text-muted-foreground">
                Mostrando {searchResults.length} visita(s) pasada(s). (Tabla de detalles próximamente)
              </p>
              <ul className="mt-2 space-y-1">
                {searchResults.map(visit => (
                    <li key={visit.id} className="text-xs p-2 border rounded-md bg-muted/30">
                       {visit.nombres} {visit.apellidos} (Doc: {visit.numerodocumento}) - Visitó a: {visit.personavisitada} el {format(visit.horaentrada, "Pp", {locale: es})}
                    </li>
                ))}
              </ul>
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
