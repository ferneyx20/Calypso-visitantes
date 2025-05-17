
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Clock, Building, UserSquare, CalendarDays, BarChart3, ListOrdered, HandMetal, Sun, Moon } from "lucide-react"; // Added Sun, Moon
import SummaryCard from "./summary-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VisitsByBranchChart, { type VisitData } from "./VisitsByBranchChart";
import RecentVisitsList, { type RecentVisit } from "./RecentVisitsList";
import { es } from "date-fns/locale";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

// Mock Data
interface Sede {
  id: string;
  name: string;
}

interface Visit {
  id: string;
  visitorName: string;
  sedeId: string;
  sedeName: string;
  timestamp: Date;
  purpose: string;
}

interface DashboardSummaryProps {
  userRole?: 'Admin' | 'Estándar';
}

const MOCK_SEDES: Sede[] = [
  { id: "sede-norte", name: "Sede Norte" },
  { id: "sede-centro", name: "Sede Centro" },
  { id: "sede-sur", name: "Sede Sur" },
  { id: "sede-principal", name: "Sede Principal" },
  { id: "sede-oeste", name: "Sede Oeste" },
];

// Helper to generate more diverse mock visits
const generateMockVisits = (numVisits: number): Visit[] => {
  const visits: Visit[] = [];
  const purposes = ["Reunión de Ventas", "Soporte Técnico", "Entrega de Paquete", "Entrevista", "Visita Proveedor", "Consulta Cliente"];
  const visitorNames = ["Ana García", "Luis Pérez", "Sofía Rodríguez", "Carlos Martínez", "Laura Gómez", "David Fernández", "Elena Castillo", "Javier Torres"];
  
  for (let i = 0; i < numVisits; i++) {
    const randomSede = MOCK_SEDES[Math.floor(Math.random() * MOCK_SEDES.length)];
    const randomPurpose = purposes[Math.floor(Math.random() * purposes.length)];
    const randomName = visitorNames[Math.floor(Math.random() * visitorNames.length)];
    // Generate timestamps within the last 60 days
    const randomDaysAgo = Math.floor(Math.random() * 60);
    const visitTimestamp = subDays(new Date(), randomDaysAgo);
    visitTimestamp.setHours(Math.floor(Math.random() * 9) + 8, Math.floor(Math.random() * 60)); // Between 8 AM and 5 PM

    visits.push({
      id: `visit-${i + 1}-${Date.now()}`,
      visitorName: randomName,
      sedeId: randomSede.id,
      sedeName: randomSede.name,
      timestamp: visitTimestamp,
      purpose: randomPurpose,
    });
  }
  return visits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by most recent
};


const ALL_MOCK_VISITS = generateMockVisits(150); // Generate 150 mock visits


export default function DashboardSummary({ userRole = 'Admin' }: DashboardSummaryProps) {
  const [dateRange, setDateRange] = useState<string>("all_time");
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>(ALL_MOCK_VISITS);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode | null>(null);
  
  const greetingUserFirstName = userRole === 'Estándar' ? "Usuario" : "Admin";

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
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
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
        setFilteredVisits(ALL_MOCK_VISITS);
        return;
    }

    const newFilteredVisits = ALL_MOCK_VISITS.filter(visit => {
      const visitDate = new Date(visit.timestamp);
      return visitDate >= startDate! && visitDate <= endDate!;
    });
    setFilteredVisits(newFilteredVisits);

  }, [dateRange]);


  const todayVisitors = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);
    return ALL_MOCK_VISITS.filter(v => v.timestamp >= todayStart && v.timestamp <= todayEnd).length;
  }, []); 

  const currentVisitors = useMemo(() => Math.floor(todayVisitors / 3) + 2, [todayVisitors]); 

  const totalSedes = MOCK_SEDES.length;
  const totalEmpleadosAdmin = 78; 
  const totalEmpleadosStandard = 15; 


  const visitsByBranchData: VisitData[] = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisits.forEach(visit => {
      counts[visit.sedeName] = (counts[visit.sedeName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5); 
  }, [filteredVisits]);

  const recentVisitsData: RecentVisit[] = useMemo(() => {
    return filteredVisits
      .slice(0, 5)
      .map(visit => ({
        id: visit.id,
        visitorName: visit.visitorName,
        branchName: visit.sedeName,
        visitTime: format(visit.timestamp, "Pp", { locale: es }),
      }));
  }, [filteredVisits]);


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
        <div className="text-xl text-muted-foreground mb-6 flex items-center justify-center text-center py-2"> {/* Increased font size and added padding */}
           {greetingIcon}
           {greeting},
           <span className="font-semibold text-primary mx-1">{greetingUserFirstName}</span>
           !
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Visitantes Hoy"
          value={todayVisitors.toString()}
          icon={<Users className="h-6 w-6 text-primary" />}
          description="Total de registros el día de hoy"
        />
        <SummaryCard
          title="Visitantes Actuales"
          value={currentVisitors.toString()}
          icon={<UserSquare className="h-6 w-6 text-primary" />}
          description="Personas actualmente en las instalaciones"
        />
        {userRole === 'Admin' && (
            <SummaryCard
              title="Total Sedes Activas"
              value={totalSedes.toString()}
              icon={<Building className="h-6 w-6 text-primary" />}
              description="Sedes operativas registradas"
            />
        )}
        <SummaryCard
          title="Total Empleados"
          value={userRole === 'Admin' ? totalEmpleadosAdmin.toString() : totalEmpleadosStandard.toString()}
          icon={<Briefcase className="h-6 w-6 text-primary" />}
          description={userRole === 'Admin' ? "Empleados registrados en el sistema" : "Empleados registrados en tu sede"}
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
