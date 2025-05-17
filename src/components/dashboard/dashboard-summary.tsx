
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LogIn, Briefcase, Clock } from "lucide-react";
import SummaryCard from "./summary-card";

export default function DashboardSummary() {
  // Placeholder data
  const todayVisitors = 25;
  const currentVisitors = 8;
  const frequentlyVisited = [
    { name: "Departamento de Ventas", visits: 120 },
    { name: "Recepción", visits: 98 },
    { name: "Recursos Humanos", visits: 75 },
  ];

  return (
    <section aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title" className="text-2xl font-semibold text-foreground mb-6">Resumen del Panel</h2>
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
          icon={<LogIn className="h-6 w-6 text-primary" />}
          description="Personas actualmente en las instalaciones"
        />
         <SummaryCard
          title="Próxima Cita"
          value="10:30 AM"
          icon={<Clock className="h-6 w-6 text-primary" />}
          description="Juan Pérez - Marketing"
        />
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Más Visitados</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {frequentlyVisited.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <p className="text-sm text-foreground">{dept.name}</p>
                  <p className="text-sm font-medium text-primary">{dept.visits} visitas</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
