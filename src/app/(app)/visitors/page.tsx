
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function VisitorsPage() {
  return (
    <div className="container mx-auto space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          Gestión de Visitantes
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            {/* Icon removed from here as it's in the main h1 now */}
            Listado de Visitantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Esta sección mostrará una tabla con todos los visitantes registrados,
            permitiendo búsquedas, filtros y la visualización de detalles de cada visita.
          </p>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Visitantes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
