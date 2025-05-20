"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Users, Search, ShieldCheck, ShieldAlert, Loader2, UserX, UserCheck as UserCheckIcon, KeyRound, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RolUsuarioPlataforma } from "@prisma/client";
import { notify, type NotificationPayload } from "@/components/layout/app-header";

interface SearchableEmployee {
  id: string;
  identificacion: string;
  nombreApellido: string;
  cargo: string;
  sede?: { name: string };
}

interface PlatformUserFromAPI {
  id: string;
  empleadoId: string;
  rol: RolUsuarioPlataforma;
  canManageAutoregister: boolean;
  isActive: boolean;
  empleado: {
    id: string;
    identificacion: string;
    nombreApellido: string;
    cargo: string;
    sede?: { name: string };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const userRoleSchema = z.object({
  empleadoId: z.string(),
  rol: z.enum(["AdminPrincipal", "Administrador", "Estandar"], { required_error: "Debe seleccionar un rol." }),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "La confirmación de contraseña es requerida."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type UserRoleFormData = z.infer<typeof userRoleSchema>;

const changeOtherUserPasswordSchema = z.object({
  newPassword: z.string().min(6, "Nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirmación de contraseña es requerida."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type ChangeOtherUserPasswordFormData = z.infer<typeof changeOtherUserPasswordSchema>;

const editUserRoleSchema = z.object({
  rol: z.enum(["AdminPrincipal", "Administrador", "Estandar"], { required_error: "Debe seleccionar un rol." }),
});
type EditUserRoleFormData = z.infer<typeof editUserRoleSchema>;


export default function UserManagementPage() {
  const [searchTermEmployee, setSearchTermEmployee] = useState("");
  const [searchableEmployees, setSearchableEmployees] = useState<SearchableEmployee[]>([]);
  const [isLoadingSearchable, setIsLoadingSearchable] = useState(false);

  const [platformUsers, setPlatformUsers] = useState<PlatformUserFromAPI[]>([]);
  const [isLoadingPlatformUsers, setIsLoadingPlatformUsers] = useState(true);
  const [searchTermPlatformUsers, setSearchTermPlatformUsers] = useState("");

  const [selectedEmployeeForConversion, setSelectedEmployeeForConversion] = useState<SearchableEmployee | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<PlatformUserFromAPI | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<PlatformUserFromAPI | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isChangeOtherPasswordDialogOpen, setIsChangeOtherPasswordDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);

  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSubmittingOtherPassword, setIsSubmittingOtherPassword] = useState(false);
  const [isSubmittingEditRole, setIsSubmittingEditRole] = useState(false);
  const { toast } = useToast();

  const [currentUserRole] = useState<RolUsuarioPlataforma>('AdminPrincipal');

  const roleForm = useForm<UserRoleFormData>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      empleadoId: "",
      rol: undefined,
      password: "",
      confirmPassword: "",
    }
  });

  const otherPasswordForm = useForm<ChangeOtherUserPasswordFormData>({
    resolver: zodResolver(changeOtherUserPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const editRoleForm = useForm<EditUserRoleFormData>({
    resolver: zodResolver(editUserRoleSchema),
  });

  const fetchPlatformUsers = async () => {
    setIsLoadingPlatformUsers(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar usuarios de plataforma');
      }
      const data: PlatformUserFromAPI[] = await response.json();
      setPlatformUsers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsLoadingPlatformUsers(false);
    }
  };

  const fetchSearchableEmployees = async (term: string) => {
    setIsLoadingSearchable(true);
    try {
      // MODIFICADO: Asumimos que la API devuelve todos los empleados que coinciden,
      // sin excluir a los que ya son usuarios.
      const response = await fetch(`/api/empleados?search=${encodeURIComponent(term)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar empleados');
      }
      const data: SearchableEmployee[] = await response.json();
      setSearchableEmployees(data); // Ya no se filtra aquí, se maneja en el renderizado del botón
    } catch (error) {
      toast({ variant: "destructive", title: "Error de Búsqueda", description: (error as Error).message });
      setSearchableEmployees([]);
    } finally {
      setIsLoadingSearchable(false);
    }
  };
  
  useEffect(() => {
    fetchPlatformUsers();
  }, []);

  useEffect(() => {
    // No es necesario depender de platformUsers aquí si la lógica del botón se maneja en el render
    // if (!isLoadingPlatformUsers) { 
      const delayDebounceFn = setTimeout(() => {
        fetchSearchableEmployees(searchTermEmployee);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    // }
  }, [searchTermEmployee /*, isLoadingPlatformUsers */]); // Quitado isLoadingPlatformUsers si no es estrictamente necesario para el debounce

  const handleOpenRoleDialog = (employee: SearchableEmployee) => {
    setSelectedEmployeeForConversion(employee);
    roleForm.reset({
      empleadoId: employee.id,
      rol: undefined,
      password: "",
      confirmPassword: "",
    });
    setIsRoleDialogOpen(true);
  };

  const onAssignRoleSubmit: SubmitHandler<UserRoleFormData> = async (data) => {
    if (!selectedEmployeeForConversion) return;
    setIsSubmittingRole(true);
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId: data.empleadoId,
          rol: data.rol,
          password: data.password
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario de plataforma');
      }
      const newPlatformUser: PlatformUserFromAPI = await response.json();
      
      // Actualizar la lista de usuarios de plataforma. Esto hará que el botón en la lista de empleados
      // se actualice en el próximo renderizado.
      setPlatformUsers(prev => [newPlatformUser, ...prev].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      
      // No es necesario modificar searchableEmployees aquí si el botón se actualiza dinámicamente.
      // Opcionalmente, se podría volver a llamar a fetchSearchableEmployees si se quiere reordenar o algo así.

      toast({
        title: "Usuario Creado",
        description: `${selectedEmployeeForConversion.nombreApellido} ahora es un usuario de la plataforma con rol ${data.rol}.`,
      });

      if (notify && typeof notify.new === 'function') {
        notify.new({
          icon: <UserCheckIcon className="h-5 w-5 text-green-500" />,
          title: "Usuario de Plataforma Creado",
          description: `${selectedEmployeeForConversion.nombreApellido} es ahora un usuario con rol ${data.rol}.`,
          type: 'user_created',
          read: false
        });
      }
      setIsRoleDialogOpen(false);
      setSelectedEmployeeForConversion(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // ... (resto de los handlers: handleToggleUserProperty, canChangePasswordForUser, etc., permanecen igual)
  const handleToggleUserProperty = async (userId: string, property: 'isActive' | 'canManageAutoregister', currentValue: boolean) => {
    const user = platformUsers.find(u => u.id === userId);
    if (!user) return;

    const updatePayload: Partial<Pick<PlatformUserFromAPI, 'isActive' | 'canManageAutoregister'>> = { [property]: !currentValue };
    
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }
      const updatedUser = await response.json();
      setPlatformUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));

      let title = "";
      let description = "";
      let notifIcon: React.ReactNode = <UserCheckIcon className="h-5 w-5 text-green-500" />;
      let notifType: NotificationPayload['type'] = 'user_updated';

      if (property === 'isActive') {
        title = `Usuario ${updatedUser.isActive ? "Activado" : "Inactivado"}`;
        description = `${user.empleado.nombreApellido} ha sido ${updatedUser.isActive ? "activado" : "inactivado"}.`;
        notifIcon = updatedUser.isActive ? <UserCheckIcon className="h-5 w-5 text-green-500" /> : <UserX className="h-5 w-5 text-red-500" />;
      } else if (property === 'canManageAutoregister') {
        title = `Permiso Autoregistro ${updatedUser.canManageAutoregister ? "Concedido" : "Revocado"}`;
        description = `${user.empleado.nombreApellido} ${updatedUser.canManageAutoregister ? "ahora puede" : "ya no puede"} gestionar el autoregistro.`;
      }
      toast({ title, description });
      if (notify && typeof notify.new === 'function') {
        notify.new({ icon: notifIcon, title, description, type: notifType, read: false });
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error de Actualización", description: (error as Error).message });
    }
  };

  const canChangePasswordForUser = (targetUserRole: PlatformUserFromAPI['rol']): boolean => {
    if (currentUserRole === 'AdminPrincipal') return true;
    if (currentUserRole === 'Administrador' && targetUserRole === 'Estandar') return true;
    return false;
  };

  const handleOpenChangeOtherPasswordDialog = (user: PlatformUserFromAPI) => {
    setUserToChangePassword(user);
    otherPasswordForm.reset();
    setIsChangeOtherPasswordDialogOpen(true);
  };

  const onChangeOtherUserPasswordSubmit: SubmitHandler<ChangeOtherUserPasswordFormData> = async (data) => {
    if (!userToChangePassword) return;
    setIsSubmittingOtherPassword(true);
    try {
      const response = await fetch(`/api/usuarios/${userToChangePassword.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }
      toast({
        title: "Contraseña Cambiada",
        description: `La contraseña para ${userToChangePassword.empleado.nombreApellido} ha sido actualizada.`,
      });
      if (notify && typeof notify.new === 'function') {
        notify.new({
          icon: <KeyRound className="h-5 w-5 text-blue-500" />,
          title: "Contraseña Actualizada",
          description: `Se actualizó la contraseña de ${userToChangePassword.empleado.nombreApellido}.`,
          type: 'user_updated',
          read: false
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingOtherPassword(false);
      setIsChangeOtherPasswordDialogOpen(false);
    }
  };

  const handleOpenEditRoleDialog = (user: PlatformUserFromAPI) => {
    setUserToEditRole(user);
    editRoleForm.reset({ rol: user.rol });
    setIsEditRoleDialogOpen(true);
  };

  const onEditRoleSubmit: SubmitHandler<EditUserRoleFormData> = async (data) => {
    if (!userToEditRole) return;
    setIsSubmittingEditRole(true);
    try {
      const response = await fetch(`/api/usuarios/${userToEditRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: data.rol }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el rol del usuario');
      }
      const updatedUser = await response.json();
      setPlatformUsers(prev => prev.map(u => u.id === userToEditRole.id ? { ...u, ...updatedUser } : u));

      toast({
        title: "Rol Actualizado",
        description: `El rol de ${userToEditRole.empleado.nombreApellido} ha sido cambiado a ${data.rol}.`,
      });
      if (notify && typeof notify.new === 'function') {
        notify.new({
          icon: <Edit className="h-5 w-5 text-orange-500" />,
          title: "Rol de Usuario Actualizado",
          description: `El rol de ${userToEditRole.empleado.nombreApellido} es ahora ${data.rol}.`,
          type: 'user_updated',
          read: false
        });
      }
      setIsEditRoleDialogOpen(false);
      setUserToEditRole(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingEditRole(false);
    }
  };

  const filteredPlatformUsers = useMemo(() => {
    if (!searchTermPlatformUsers.trim()) {
      return platformUsers;
    }
    const lowerSearchTerm = searchTermPlatformUsers.toLowerCase();
    return platformUsers.filter(user =>
      user.empleado.nombreApellido.toLowerCase().includes(lowerSearchTerm) ||
      user.empleado.identificacion.toLowerCase().includes(lowerSearchTerm)
    );
  }, [platformUsers, searchTermPlatformUsers]);

  // Crear un Set de empleadoIds que ya son usuarios para referencia rápida
  const platformUserEmployeeIds = useMemo(() => new Set(platformUsers.map(pu => pu.empleadoId)), [platformUsers]);

  return (
    <TooltipProvider>
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
                value={searchTermEmployee}
                onChange={(e) => setSearchTermEmployee(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {isLoadingSearchable && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!isLoadingSearchable && searchableEmployees.length > 0 ? (
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
                    {searchableEmployees.slice(0, 5).map((emp) => {
                      const isAlreadyUser = platformUserEmployeeIds.has(emp.id); // MODIFICADO: Verificar si ya es usuario
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>{emp.identificacion}</TableCell>
                          <TableCell className="font-medium">{emp.nombreApellido}</TableCell>
                          <TableCell>{emp.cargo}</TableCell>
                          <TableCell>{emp.sede?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => !isAlreadyUser && handleOpenRoleDialog(emp)} // Solo abrir si no es usuario
                              disabled={isAlreadyUser} // MODIFICADO: Deshabilitar si ya es usuario
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              {isAlreadyUser ? 'Ya es Usuario' : 'Convertir a Usuario'} {/* MODIFICADO: Cambiar texto del botón */}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {searchableEmployees.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Mostrando 5 de {searchableEmployees.length} empleados. Refine su búsqueda.
                  </p>
                )}
              </div>
            ) : (
              !isLoadingSearchable && (
                <p className="text-muted-foreground text-center py-4">
                  {searchTermEmployee ? "No se encontraron empleados." : "Ingrese un término para buscar empleados."}
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* Card para Usuarios de la Plataforma (la lógica de mostrar 5 y buscar ya está implementada) */}
        <Card className="shadow-lg flex flex-col flex-1 w-full">
          <CardHeader>
            <CardTitle>Usuarios de la Plataforma</CardTitle>
            <CardDescription>
              Lista de empleados con acceso a la plataforma, sus roles y permisos.
              <br />
              <span className="text-xs text-muted-foreground">(Rol actual simulado para esta vista: {currentUserRole})</span>
            </CardDescription>
            <div className="flex items-center gap-2 pt-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar usuarios por nombre o identificación..."
                value={searchTermPlatformUsers}
                onChange={(e) => setSearchTermPlatformUsers(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 flex flex-col flex-1">
            {isLoadingPlatformUsers ? (
              <div className="mt-4 flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPlatformUsers.length > 0 ? (
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
                    {filteredPlatformUsers.slice(0, 5).map((user) => (
                      <TableRow key={user.id} className={cn(!user.isActive && "opacity-60")}>
                        <TableCell className="font-medium">{user.empleado.nombreApellido}</TableCell>
                        <TableCell>{user.empleado.identificacion}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            user.rol === "AdminPrincipal" ? "bg-red-600/20 text-red-700 dark:text-red-400" :
                              user.rol === "Administrador" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                            !user.isActive && "bg-gray-200 text-gray-500"
                          )}>
                            {user.rol === "AdminPrincipal" ? <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> : user.rol === "Administrador" ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> : <Users className="mr-1.5 h-3.5 w-3.5" />}
                            {user.rol === "AdminPrincipal" ? "Admin Principal" : user.rol === "Estandar" ? "Estándar" : user.rol}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`autoregister-${user.id}`}
                              checked={user.canManageAutoregister}
                              onCheckedChange={() => handleToggleUserProperty(user.id, 'canManageAutoregister', user.canManageAutoregister)}
                              aria-label={`Permiso de autoregistro para ${user.empleado.nombreApellido}`}
                              disabled={!user.isActive}
                            />
                            <Label htmlFor={`autoregister-${user.id}`} className={cn("text-xs", !user.isActive && "text-muted-foreground/50")}>
                              {user.canManageAutoregister ? "Permitido" : "Denegado"}
                            </Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {user.isActive && (currentUserRole === "AdminPrincipal" || (currentUserRole === "Administrador" && user.rol !== "AdminPrincipal")) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleOpenEditRoleDialog(user)}
                                  disabled={!user.isActive}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Rol de {user.empleado.nombreApellido}</p></TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={user.isActive ? "outline" : "secondary"}
                                size="icon"
                                onClick={() => handleToggleUserProperty(user.id, 'isActive', user.isActive)}
                              >
                                {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheckIcon className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.isActive ? "Inactivar Usuario" : "Activar Usuario"}</p>
                            </TooltipContent>
                          </Tooltip>
                          {canChangePasswordForUser(user.rol) && user.isActive && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleOpenChangeOtherPasswordDialog(user)}
                                  disabled={!user.isActive}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Cambiar Contraseña de {user.empleado.nombreApellido}</p></TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPlatformUsers.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Mostrando 5 de {filteredPlatformUsers.length} usuarios de plataforma. Refine su búsqueda.
                  </p>
                )}
              </div>
            ) : (
              !isLoadingPlatformUsers && (
                <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
                  <p className="text-muted-foreground">
                    {searchTermPlatformUsers ? "No se encontraron usuarios con ese criterio." : "No hay usuarios de plataforma creados."}
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Dialogs permanecen igual */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar Rol a: {selectedEmployeeForConversion?.nombreApellido}</DialogTitle>
              <DialogDescription>
                Seleccione el rol y establezca una contraseña para este nuevo usuario en la plataforma.
              </DialogDescription>
            </DialogHeader>
            <Form {...roleForm}>
              <form onSubmit={roleForm.handleSubmit(onAssignRoleSubmit)} className="space-y-4 py-2">
                <FormField
                  control={roleForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol del Usuario</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Estandar">Estándar (Recepcionista)</SelectItem>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="AdminPrincipal">Admin Principal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
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

        <Dialog open={isChangeOtherPasswordDialogOpen} onOpenChange={setIsChangeOtherPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar Contraseña para: {userToChangePassword?.empleado.nombreApellido}</DialogTitle>
              <DialogDescription>Establezca una nueva contraseña para este usuario.</DialogDescription>
            </DialogHeader>
            <Form {...otherPasswordForm}>
              <form onSubmit={otherPasswordForm.handleSubmit(onChangeOtherUserPasswordSubmit)} className="space-y-4 py-2">
                <FormField
                  control={otherPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otherPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmittingOtherPassword}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingOtherPassword}>
                    {isSubmittingOtherPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Establecer Contraseña
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Rol de: {userToEditRole?.empleado.nombreApellido}</DialogTitle>
              <DialogDescription>Seleccione el nuevo rol para este usuario.</DialogDescription>
            </DialogHeader>
            <Form {...editRoleForm}>
              <form onSubmit={editRoleForm.handleSubmit(onEditRoleSubmit)} className="space-y-4 py-2">
                <FormField
                  control={editRoleForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Rol del Usuario</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un nuevo rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Estandar" disabled={userToEditRole?.rol === "AdminPrincipal" && currentUserRole !== "AdminPrincipal"}>Estándar (Recepcionista)</SelectItem>
                          <SelectItem value="Administrador" disabled={userToEditRole?.rol === "AdminPrincipal" && currentUserRole !== "AdminPrincipal"}>Administrador</SelectItem>
                          {currentUserRole === "AdminPrincipal" && (
                            <SelectItem value="AdminPrincipal">Admin Principal</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmittingEditRole}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingEditRole || editRoleForm.getValues("rol") === userToEditRole?.rol}>
                    {isSubmittingEditRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios de Rol
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}