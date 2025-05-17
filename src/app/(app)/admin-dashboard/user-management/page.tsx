
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Users, Search, PlusCircle, Edit3, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Simulación de un empleado existente que puede ser convertido a usuario
interface SearchableEmployee {
  id: string;
  identificacion: string;
  nombreApellido: string;
  cargo: string;
  sede: string;
}

// Simulación de un usuario de la plataforma
interface PlatformUser extends SearchableEmployee {
  userId: string;
  role: "Administrador" | "Estándar";
  email?: string; // Email para el login del usuario de plataforma
}

const MOCK_SEARCHABLE_EMPLOYEES: SearchableEmployee[] = [
  { id: "emp-1", identificacion: "11223344", nombreApellido: "Ana García", cargo: "Gerente de Ventas", sede: "Sede Principal" },
  { id: "emp-2", identificacion: "55667788", nombreApellido: "Luis Torres", cargo: "Desarrollador Senior", sede: "Sede Norte" },
  { id: "emp-3", identificacion: "99001122", nombreApellido: "Sofia Chen", cargo: "Analista de Marketing", sede: "Sede Centro" },
];

const userRoleSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  role: z.enum(["Administrador", "Estándar"], { required_error: "Debe seleccionar un rol." }),
  // Opcional: email para el usuario de plataforma, si es diferente o se asigna aquí
  email: z.string().email({ message: "Ingrese un correo válido para el usuario." }).optional(),
});
type UserRoleFormData = z.infer<typeof userRoleSchema>;


export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableEmployee[]>(MOCK_SEARCHABLE_EMPLOYEES); // Inicialmente muestra todos
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
      setSearchResults(MOCK_SEARCHABLE_EMPLOYEES); // Mostrar todos si no hay término
      return;
    }
    // Simulación de búsqueda
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
      role: undefined, // Forzar selección
      email: `${employee.nombreApellido.toLowerCase().replace(/\s+/g, '.')}@example.com` // Email sugerido
    });
    setIsRoleDialogOpen(true);
  };

  const onAssignRoleSubmit: SubmitHandler<UserRoleFormData> = async (data) => {
    if (!selectedEmployee) return;
    setIsSubmittingRole(true);
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newPlatformUser: PlatformUser = {
      ...selectedEmployee,
      userId: `user-${Date.now()}`,
      role: data.role,
      email: data.email,
    };
    setPlatformUsers(prev => [...prev, newPlatformUser]);
    // Opcional: remover de searchResults si ya fue convertido
    // setSearchResults(prev => prev.filter(emp => emp.id !== selectedEmployee.id));

    toast({
      title: "Usuario Creado",
      description: `${selectedEmployee.nombreApellido} ahora es un usuario de la plataforma con rol ${data.role}.`,
    });
    setIsSubmittingRole(false);
    setIsRoleDialogOpen(false);
  };


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <UserCog className="mr-3 h-8 w-8 text-primary" />
          Gestión de Usuarios
        </h1>
        {/* Podría haber un botón para crear usuarios administradores directamente si es necesario */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Buscar Empleados para Convertir en Usuarios</CardTitle>
          <CardDescription>
            Busque empleados existentes por nombre o identificación para asignarles un rol y acceso a la plataforma.
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
                  {searchResults.map((emp) => (
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
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {searchTerm ? "No se encontraron empleados." : "Ingrese un término para buscar empleados."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Usuarios de la Plataforma</CardTitle>
          <CardDescription>
            Lista de empleados que tienen acceso a la plataforma y sus roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {platformUsers.length > 0 ? (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email (Login)</TableHead>
                    <TableHead>Rol</TableHead>
                    {/* <TableHead className="text-right">Acciones</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.nombreApellido}</TableCell>
                       <TableCell>{user.email || 'No asignado'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "Administrador" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {user.role === "Administrador" ? <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> : <Users className="mr-1.5 h-3.5 w-3.5" />}
                          {user.role}
                        </span>
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><Edit3 className="h-4 w-4" /></Button>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay usuarios de plataforma creados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para Asignar Rol */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Rol a: {selectedEmployee?.nombreApellido}</DialogTitle>
            <DialogDescription>
              Seleccione el rol para este usuario en la plataforma. Opcionalmente, defina su email de acceso.
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
              <FormField
                control={roleForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Acceso (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ejemplo@dominio.com" {...field} />
                    </FormControl>
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
