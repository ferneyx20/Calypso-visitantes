
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react"; // O usa Settings si prefieres

export default function UserManagementPage() {
  return (
    <div className="w-full flex flex-col flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <UserCog className="mr-3 h-8 w-8 text-primary" /> {/* O Settings */}
          Gestión de Usuarios
        </h1>
        {/* Aquí podrías añadir un botón para "Agregar Usuario" en el futuro */}
      </div>

      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Administrar Usuarios</CardTitle>
          <CardDescription>
            Aquí podrá crear, editar y gestionar los roles de los usuarios (recepcionistas, administradores).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Usuarios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
