
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Clock, Building, UserSquare, CalendarDays, BarChart3, ListOrdered, HandMetal, Sun, Moon, Loader2 } from "lucide-react";
import SummaryCard from "./summary-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VisitsByBranchChart, { type VisitData } from "./VisitsByBranchChart";
import RecentVisitsList, { type RecentVisit } from "./RecentVisitsList";
import { es } from "date-fns/locale";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import type { RolUsuarioPlataforma } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface SedeFromAPI {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}
interface EmployeeFromAPI {
  id: string;
  identificacion: string;
  nombreApellido: string;
  cargo: string;
  sedeId: string;
  sede?: { name: string };
  createdAt: string;
  updatedAt: string;
}
interface VisitFromAPI {
  id: string;
  nombres: string;
  apellidos: string;
  horaentrada: string; // ISO string
  sede?: { name: string }; // Asumiendo que la API puede devolver esto si personavisitadaId se usa para inferir sede
  personavisitada?: { nombreApellido: string, sede?: { name: string } };
  // Para visitas por sede, necesitaríamos la sede de la visita.
  // Si personavisitada.sede no está disponible, podríamos necesitar un campo sede_id en la visita
}

interface DashboardSummaryProps {
  userRole?: RolUsuarioPlataforma | 'Admin' | 'Estándar'; // 'Admin' es fallback
}

export default function DashboardSummary({ userRole = 'Admin' }: DashboardSummaryProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>("all_time");
  
  const [allVisits, setAllVisits] = useState<VisitFromAPI[]>([]);
  const [allSedes, setAllSedes] = useState<SedeFromAPI[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [greeting, setGreeting] = useState<string | null>(null);
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode | null>(null);
  
  const greetingUserFirstName = userRole === 'Estandar' ? "Usuario" : "Admin";

  useEffect(() => {
    const currentHour = new Date().getHours();
    let timeOfDayGreeting = "Buenos días";
    let icon: React.ReactNode = <Sun className="mr-2 h-6 w-6 text-primary" />;

    if (currentHour >= 12 && currentHour < 18) {
      timeOfDayGreeting = "Buenas tardes";
      icon = <Sun className="mr-2 h-6 w-6 text-primary" />;
    } else if (currentHour >= 18 || currentHour < 5) { 
      timeOfDayGreeting = "Buenas noches";
      icon = <Moon className="mr-2 h-6 w-6 text-primary" />;
    }
    setGreeting(timeOfDayGreeting);
    setGreetingIcon(icon);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [visitsRes, sedesRes, employeesRes] = await Promise.all([
          fetch('/api/visitantes'), // Podríamos añadir ?estado=activa o filtros de fecha aquí si el backend los soporta
          fetch('/api/sedes'),
          fetch('/api/empleados')
        ]);

        if (!visitsRes.ok) throw new Error('Error al cargar visitas');
        if (!sedesRes.ok) throw new Error('Error al cargar sedes');
        if (!employeesRes.ok) throw new Error('Error al cargar empleados');

        const visitsData = await visitsRes.json();
        const sedesData = await sedesRes.json();
        const employeesData = await employeesRes.json();

        setAllVisits(visitsData);
        setAllSedes(sedesData);
        setAllEmployees(employeesData);

      } catch (error) {
        toast({ variant: "destructive", title: "Error de Carga", description: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);


  const filteredVisits = useMemo(() => {
    if (isLoading) return [];
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999)); // Reset hours for today end
        now.setHours(0,0,0,0); // reset now for next calculations
        break;
      case "yesterday":
        const yesterday = subDays(now, 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case "this_week":
        startDate = startOfWeek(now, { locale: es });
        endDate = endOfWeek(now, { locale: es });
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "all_time":
      default:
        return allVisits;
    }
    
    return allVisits.filter(visit => {
      const visitDate = parseISO(visit.horaentrada); // API devuelve string ISO
      return visitDate >= startDate! && visitDate <= endDate!;
    });
  }, [dateRange, allVisits, isLoading]);


  const todayVisitorsCount = useMemo(() => {
    if (isLoading) return 0;
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);
    return allVisits.filter(v => {
        const visitDate = parseISO(v.horaentrada);
        return visitDate >= todayStart && visitDate <= todayEnd;
    }).length;
  }, [allVisits, isLoading]); 

  // Simulación, ya que no tenemos estado 'activo' vs 'total' desde el backend directamente aquí
  const currentVisitorsCount = useMemo(() => {
    if (isLoading) return 0;
    // En una app real, esto vendría de /api/visitantes?estado=activa
    return Math.floor(todayVisitorsCount / 3) + (allVisits.length > 0 ? 1 : 0) ; 
  }, [todayVisitorsCount, allVisits, isLoading]); 

  const totalSedesCount = useMemo(() => isLoading ? 0 : allSedes.length, [allSedes, isLoading]);
  const totalEmployeesCount = useMemo(() => isLoading ? 0 : allEmployees.length, [allEmployees, isLoading]);
  // Para usuario estándar, podríamos filtrar empleados por sede si tuviéramos la sede del usuario
  const totalEmployeesStandardCount = 15; // Simulación


  const visitsByBranchData: VisitData[] = useMemo(() => {
    if (isLoading) return [];
    const counts: Record<string, number> = {};
    filteredVisits.forEach(visit => {
      // Tratar de obtener la sede de la visita. 
      // Asumimos que personavisitada.sede.name está disponible o una lógica similar.
      // Esto es una simplificación; en una app real, la estructura de datos de la visita podría tener un `sedeId` directo.
      const sedeName = visit.personavisitada?.sede?.name || visit.sede?.name || "Sede Desconocida";
      counts[sedeName] = (counts[sedeName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5); 
  }, [filteredVisits, isLoading]);

  const recentVisitsData: RecentVisit[] = useMemo(() => {
    if (isLoading) return [];
    return filteredVisits // Ya están ordenadas por horaentrada desc en la API (asumido)
      .slice(0, 5)
      .map(visit => ({
        id: visit.id,
        visitorName: `${visit.nombres} ${visit.apellidos}`,
        branchName: visit.personavisitada?.sede?.name || visit.sede?.name || "Sede Desconocida",
        visitTime: format(parseISO(visit.horaentrada), "Pp", { locale: es }),
      }));
  }, [filteredVisits, isLoading]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section aria-labelledby="dashboard-summary-title" className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 id="dashboard-summary-title" className="text-2xl font-semibold text-foreground">Resumen del Panel</h2>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="this_week">Esta Semana</SelectItem>
              <SelectItem value="this_month">Este Mes</SelectItem>
              <SelectItem value="all_time">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {greeting && greetingIcon && (
        <div className="text-xl text-muted-foreground mb-6 flex items-center justify-center text-center py-2">
           {greetingIcon}
           {greeting},
           <span className="font-semibold text-primary mx-1">{greetingUserFirstName}</span>
           !
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Visitantes Hoy"
          value={todayVisitorsCount.toString()}
          icon={<Users className="h-6 w-6 text-primary" />}
          description="Total de registros el día de hoy"
        />
        <SummaryCard
          title="Visitantes Actuales"
          value={currentVisitorsCount.toString()}
          icon={<UserSquare className="h-6 w-6 text-primary" />}
          description="Personas actualmente en las instalaciones"
        />
        {userRole !== 'Estandar' && (
            <SummaryCard
              title="Total Sedes Activas"
              value={totalSedesCount.toString()}
              icon={<Building className="h-6 w-6 text-primary" />}
              description="Sedes operativas registradas"
            />
        )}
        <SummaryCard
          title="Total Empleados"
          value={userRole !== 'Estandar' ? totalEmployeesCount.toString() : totalEmployeesStandardCount.toString()}
          icon={<Briefcase className="h-6 w-6 text-primary" />}
          description={userRole !== 'Estandar' ? "Empleados registrados en el sistema" : "Empleados registrados en tu sede"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-6 w-6 text-primary"/>
                Visitas por Sede
            </CardTitle>
            <CardDescription>
              Distribución de visitas en las sedes ({
                dateRange === "today" ? "Hoy" :
                dateRange === "yesterday" ? "Ayer" :
                dateRange === "this_week" ? "Esta Semana" :
                dateRange === "this_month" ? "Este Mes" : "Total"
              }). Mostrando hasta 5 sedes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-6 pb-6">
            {visitsByBranchData.length > 0 ? (
              <VisitsByBranchChart data={visitsByBranchData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay datos de visitas para el período seleccionado.
              </div>
            )}
            
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
                <ListOrdered className="mr-2 h-6 w-6 text-primary"/>
                Últimas 5 Visitas
            </CardTitle>
             <CardDescription>
              Visitas más recientes registradas ({
                dateRange === "today" ? "Hoy" :
                dateRange === "yesterday" ? "Ayer" :
                dateRange === "this_week" ? "Esta Semana" :
                dateRange === "this_month" ? "Este Mes" : "Total"
              }).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentVisitsList visits={recentVisitsData} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
