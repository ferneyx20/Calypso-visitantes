
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Users, Search, ShieldCheck, ShieldAlert, Loader2, UserX, UserCheck as UserCheckIcon, KeyRound, Edit, PackageCheck, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RolUsuarioPlataforma } from "@prisma/client"; 
import { notify } from "@/components/layout/app-header"; // Importar el emisor de notificaciones

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


export default function UserManagementPage() {
  const [searchTermEmployee, setSearchTermEmployee] = useState("");
  const [searchableEmployees, setSearchableEmployees] = useState<SearchableEmployee[]>([]);
  const [isLoadingSearchable, setIsLoadingSearchable] = useState(false);
  
  const [platformUsers, setPlatformUsers] = useState<PlatformUserFromAPI[]>([]);
  const [isLoadingPlatformUsers, setIsLoadingPlatformUsers] = useState(true);

  const [selectedEmployeeForConversion, setSelectedEmployeeForConversion] = useState<SearchableEmployee | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<PlatformUserFromAPI | null>(null);
  
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isChangeOtherPasswordDialogOpen, setIsChangeOtherPasswordDialogOpen] = useState(false);
  
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSubmittingOtherPassword, setIsSubmittingOtherPassword] = useState(false);
  const { toast } = useToast();

  const [currentUserRole] = useState<RolUsuarioPlataforma>('AdminPrincipal');


  const roleForm = useForm<UserRoleFormData>({
    resolver: zodResolver(userRoleSchema),
  });

  const otherPasswordForm = useForm<ChangeOtherUserPasswordFormData>({
    resolver: zodResolver(changeOtherUserPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
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
    if (!term) {
      setSearchableEmployees([]);
      return;
    }
    setIsLoadingSearchable(true);
    try {
      const response = await fetch(`/api/empleados?search=${encodeURIComponent(term)}`); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar empleados');
      }
      const data: SearchableEmployee[] = await response.json();
      setSearchableEmployees(data);
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
    const delayDebounceFn = setTimeout(() => {
      if (searchTermEmployee.trim()) {
        fetchSearchableEmployees(searchTermEmployee);
      } else {
        setSearchableEmployees([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTermEmployee]);


  const handleOpenRoleDialog = (employee: SearchableEmployee) => {
    setSelectedEmployeeForConversion(employee);
    roleForm.reset({
      empleadoId: employee.id,
      rol: undefined,
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
        body: JSON.stringify({ empleadoId: data.empleadoId, rol: data.rol }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario de plataforma');
      }
      toast({
        title: "Usuario Creado",
        description: `${selectedEmployeeForConversion.nombreApellido} ahora es un usuario de la plataforma con rol ${data.rol}.`,
      });
      
      notify.new({
        icon: <UserCheckIcon className="h-5 w-5 text-green-500" />,
        title: "Usuario de Plataforma Creado",
        description: `${selectedEmployeeForConversion.nombreApellido} es ahora un usuario con rol ${data.rol}.`,
        type: 'user_created',
        read: false
      });

      fetchPlatformUsers(); 
      setIsRoleDialogOpen(false);
      setSelectedEmployeeForConversion(null);
      setSearchTermEmployee(""); 
      setSearchableEmployees([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleToggleUserProperty = async (userId: string, property: 'isActive' | 'canManageAutoregister', currentValue: boolean) => {
    const user = platformUsers.find(u => u.id === userId);
    if (!user) return;

    const updatePayload: Partial<PlatformUserFromAPI> = { [property]: !currentValue };
    
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
      setPlatformUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      let title = "";
      let description = "";
      let notifIcon = <UserCheckIcon className="h-5 w-5 text-green-500" />;
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
      notify.new({ icon: notifIcon, title, description, type: notifType, read: false });

    } catch (error) {
      toast({ variant: "destructive", title: "Error de Actualización", description: (error as Error).message });
       fetchPlatformUsers(); 
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
      notify.new({
          icon: <KeyRound className="h-5 w-5 text-blue-500" />,
          title: "Contraseña Actualizada",
          description: `Se actualizó la contraseña de ${userToChangePassword.empleado.nombreApellido}.`,
          type: 'user_updated',
          read: false
      });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingOtherPassword(false);
      setIsChangeOtherPasswordDialogOpen(false);
    }
  };


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
          {!isLoadingSearchable && searchableEmployees.slice(0, 5).length > 0 ? (
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
                  {searchableEmployees.slice(0, 5).map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.identificacion}</TableCell>
                      <TableCell className="font-medium">{emp.nombreApellido}</TableCell>
                      <TableCell>{emp.cargo}</TableCell>
                      <TableCell>{emp.sede?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenRoleDialog(emp)} disabled={platformUsers.some(pu => pu.empleadoId === emp.id)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {platformUsers.some(pu => pu.empleadoId === emp.id) ? 'Ya es Usuario' : 'Convertir a Usuario'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <CardTitle>Usuarios de la Plataforma</CardTitle>
          <CardDescription>
            Lista de empleados con acceso a la plataforma, sus roles y permisos (máximo 5 mostrados).
            <br />
            <span className="text-xs text-muted-foreground">(Rol actual simulado para esta vista: {currentUserRole})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {isLoadingPlatformUsers ? (
             <div className="mt-4 flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : platformUsers.length > 0 ? (
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
                            onCheckedChange={(checked) => handleToggleUserProperty(user.id, 'canManageAutoregister', user.canManageAutoregister)}
                            aria-label={`Permiso de autoregistro para ${user.empleado.nombreApellido}`}
                            disabled={!user.isActive || user.rol === 'Estandar'}
                          />
                          <Label htmlFor={`autoregister-${user.id}`} className={cn("text-xs", !user.isActive && "text-muted-foreground/50")}>
                            {user.canManageAutoregister ? "Permitido" : "Denegado"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
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
               {platformUsers.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mostrando 5 de {platformUsers.length} usuarios de plataforma.
                </p>
              )}
            </div>
          ) : (
           !isLoadingPlatformUsers && (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay usuarios de plataforma creados.</p>
            </div>
           )
          )}
        </CardContent>
      </Card>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Rol a: {selectedEmployeeForConversion?.nombreApellido}</DialogTitle>
            <DialogDescription>
              Seleccione el rol para este usuario en la plataforma.
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onAssignRoleSubmit)} className="space-y-4">
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

    </div>
    </TooltipProvider>
  );
}
