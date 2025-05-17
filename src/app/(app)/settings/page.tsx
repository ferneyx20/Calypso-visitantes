
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary" />
          Configuración
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            {/* Icon removed from here as it's in the main h1 now */}
            Configuración de la Aplicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrá configurar aspectos generales de la aplicación, como
            ajustes de notificaciones, gestión de usuarios administradores, y
            preferencias de la interfaz.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferencias Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Ajustes de idioma, tema, etc.</p>
                 <div className="mt-4 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Controles de Preferencias</p>
                 </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Administrar cuentas de recepcionistas.</p>
                 <div className="mt-4 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Tabla de Usuarios</p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
