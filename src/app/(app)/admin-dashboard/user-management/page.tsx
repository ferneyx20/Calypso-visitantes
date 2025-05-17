
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Users, Search, ShieldCheck, ShieldAlert, Loader2, UserX, UserCheck as UserCheckIcon } from "lucide-react"; // Added UserX, UserCheckIcon
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


interface SearchableEmployee {
  id: string;
  identificacion: string;
  nombreApellido: string;
  cargo: string;
  sede: string;
}

interface PlatformUser extends SearchableEmployee {
  userId: string;
  role: "Administrador" | "Estándar";
  canManageAutoregister: boolean;
  isActive: boolean; // Nuevo campo
}

const MOCK_SEARCHABLE_EMPLOYEES: SearchableEmployee[] = [
  { id: "emp-1", identificacion: "11223344", nombreApellido: "Ana García", cargo: "Gerente de Ventas", sede: "Sede Principal" },
  { id: "emp-2", identificacion: "55667788", nombreApellido: "Luis Torres", cargo: "Desarrollador Senior", sede: "Sede Norte" },
  { id: "emp-3", identificacion: "99001122", nombreApellido: "Sofia Chen", cargo: "Analista de Marketing", sede: "Sede Centro" },
  { id: "emp-4", identificacion: "12121212", nombreApellido: "Mario Bro", cargo: "Plomero", sede: "Sede Principal" },
  { id: "emp-5", identificacion: "34343434", nombreApellido: "Luigi Sis", cargo: "Ayudante Plomero", sede: "Sede Norte" },
  { id: "emp-6", identificacion: "56565656", nombreApellido: "Peach Queen", cargo: "Reina", sede: "Sede Principal" },
  { id: "emp-7", identificacion: "78787878", nombreApellido: "Bowser King", cargo: "Villano", sede: "Sede Sur" },
];

const userRoleSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  role: z.enum(["Administrador", "Estándar"], { required_error: "Debe seleccionar un rol." }),
});
type UserRoleFormData = z.infer<typeof userRoleSchema>;


export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableEmployee[]>(MOCK_SEARCHABLE_EMPLOYEES);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<SearchableEmployee | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const { toast } = useToast();

  const roleForm = useForm<UserRoleFormData>({
    resolver: zodResolver(userRoleSchema),
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) {
      setSearchResults(MOCK_SEARCHABLE_EMPLOYEES);
      return;
    }
    setSearchResults(
      MOCK_SEARCHABLE_EMPLOYEES.filter(
        emp => emp.nombreApellido.toLowerCase().includes(term) || emp.identificacion.includes(term)
      )
    );
  };

  const handleOpenRoleDialog = (employee: SearchableEmployee) => {
    setSelectedEmployee(employee);
    roleForm.reset({
      employeeId: employee.id,
      employeeName: employee.nombreApellido,
      role: undefined,
    });
    setIsRoleDialogOpen(true);
  };

  const onAssignRoleSubmit: SubmitHandler<UserRoleFormData> = async (data) => {
    if (!selectedEmployee) return;
    setIsSubmittingRole(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newPlatformUser: PlatformUser = {
      ...selectedEmployee,
      userId: `user-${Date.now()}`,
      role: data.role,
      canManageAutoregister: data.role === "Administrador",
      isActive: true, // Nuevo usuario es activo por defecto
    };
    setPlatformUsers(prev => [newPlatformUser, ...prev]); // Añadir al inicio para verlo si la lista es larga

    toast({
      title: "Usuario Creado",
      description: `${selectedEmployee.nombreApellido} ahora es un usuario de la plataforma con rol ${data.role}.`,
    });
    setIsSubmittingRole(false);
    setIsRoleDialogOpen(false);
  };

  const handleToggleAutoregisterPermission = (userId: string, enabled: boolean) => {
    setPlatformUsers(prevUsers =>
      prevUsers.map(u =>
        u.userId === userId ? { ...u, canManageAutoregister: enabled } : u
      )
    );
    const userName = platformUsers.find(u => u.userId === userId)?.nombreApellido || "Usuario";
    toast({
      title: `Permiso de Autoregistro ${enabled ? "Concedido" : "Revocado"}`,
      description: `${userName} ${enabled ? "ahora puede" : "ya no puede"} gestionar el autoregistro.`,
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    let userName = "Usuario";
    let newStatus = false;
    setPlatformUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.userId === userId) {
          userName = u.nombreApellido;
          newStatus = !u.isActive;
          return { ...u, isActive: !u.isActive };
        }
        return u;
      })
    );
     toast({
      title: `Usuario ${newStatus ? "Activado" : "Inactivado"}`,
      description: `${userName} ha sido ${newStatus ? "activado" : "inactivado"}.`,
    });
  };


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <UserCog className="mr-3 h-8 w-8 text-primary" />
          Gestión de Usuarios
        </h1>
      </div>

      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Buscar Empleados para Convertir en Usuarios</CardTitle>
          <CardDescription>
            Busque empleados existentes por nombre o identificación para asignarles un rol (máximo 5 mostrados).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o identificación..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-sm"
            />
          </div>
          {searchResults.length > 0 ? (
            <div className="overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Sede</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.slice(0, 5).map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.identificacion}</TableCell>
                      <TableCell className="font-medium">{emp.nombreApellido}</TableCell>
                      <TableCell>{emp.cargo}</TableCell>
                      <TableCell>{emp.sede}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenRoleDialog(emp)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Convertir a Usuario
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {searchResults.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mostrando 5 de {searchResults.length} empleados. Refine su búsqueda.
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {searchTerm ? "No se encontraron empleados." : "Ingrese un término para buscar empleados o vea la lista inicial (máx. 5)."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <CardTitle>Usuarios de la Plataforma</CardTitle>
          <CardDescription>
            Lista de empleados con acceso a la plataforma, sus roles y permisos (máximo 5 mostrados).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {platformUsers.length > 0 ? (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Permiso Autoregistro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformUsers.slice(0, 5).map((user) => (
                    <TableRow key={user.userId} className={cn(!user.isActive && "opacity-60")}>
                      <TableCell className="font-medium">{user.nombreApellido}</TableCell>
                       <TableCell>{user.identificacion}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", 
                          user.role === "Administrador" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                          !user.isActive && "bg-gray-200 text-gray-500"
                        )}>
                          {user.role === "Administrador" ? <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> : <Users className="mr-1.5 h-3.5 w-3.5" />}
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                           <Switch
                            id={`autoregister-${user.userId}`}
                            checked={user.canManageAutoregister}
                            onCheckedChange={(checked) => handleToggleAutoregisterPermission(user.userId, checked)}
                            aria-label={`Permiso de autoregistro para ${user.nombreApellido}`}
                            disabled={!user.isActive}
                          />
                          <Label htmlFor={`autoregister-${user.userId}`} className={cn("text-xs", !user.isActive && "text-muted-foreground/50")}>
                            {user.canManageAutoregister ? "Permitido" : "Denegado"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={user.isActive ? "outline" : "secondary"} 
                          size="sm" 
                          onClick={() => handleToggleUserStatus(user.userId)}
                          className="w-28"
                        >
                          {user.isActive ? <UserX className="mr-2 h-4 w-4" /> : <UserCheckIcon className="mr-2 h-4 w-4" />}
                          {user.isActive ? "Inactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               {platformUsers.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mostrando 5 de {platformUsers.length} usuarios de plataforma.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay usuarios de plataforma creados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Rol a: {selectedEmployee?.nombreApellido}</DialogTitle>
            <DialogDescription>
              Seleccione el rol para este usuario en la plataforma.
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onAssignRoleSubmit)} className="space-y-4">
              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol del Usuario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Estándar">Estándar (Recepcionista)</SelectItem>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmittingRole}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingRole}>
                  {isSubmittingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Crear Usuario de Plataforma"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    