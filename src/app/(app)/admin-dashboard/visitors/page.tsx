
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function VisitorsPage() {
  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Gestión de Visitantes
        </h1>
      </div>
      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <CardTitle>
            Listado de Visitantes
          </CardTitle>
          <CardDescription>
            Esta sección mostrará una tabla con todos los visitantes registrados,
            permitiendo búsquedas, filtros y la visualización de detalles de cada visita.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Visitantes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
