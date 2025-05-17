
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function VisitorsPage() {
  return (
    <div className="container mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-6 w-6 text-primary" />
            Gestión de Visitantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección mostrará una tabla con todos los visitantes registrados,
            permitiendo búsquedas, filtros y la visualización de detalles de cada visita.
          </p>
          <div className="mt-8 flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Visitantes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
