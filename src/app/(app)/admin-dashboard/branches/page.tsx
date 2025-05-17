
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function BranchesPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-semibold flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-primary" />
          Gestión de Sedes
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Administrar Sedes</CardTitle>
          <CardDescription>
            Aquí podrá crear, editar y eliminar las sedes de la organización.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Funcionalidad de Gestión de Sedes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
