
"use client";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle, Bell, Sun, Moon, UserPlus, UserCheck, FilePenLine, AlarmClockOff, Trash2, LogOut, KeyRound, Image as ImageIcon, Edit3, ShieldQuestion } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  read?: boolean;
}

const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `Hace ${interval} años`;
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `Hace ${interval} meses`;
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `Hace ${interval} días`;
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `Hace ${interval} horas`;
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `Hace ${interval} min`;
  return `Hace ${Math.floor(seconds)} seg`;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", icon: <UserPlus className="h-5 w-5 text-blue-500" />, title: "Nuevo Visitante", description: "Ana García ha ingresado a Sede Principal.", timestamp: timeAgo(new Date(Date.now() - 5 * 60 * 1000)), read: false },
  { id: "2", icon: <UserCheck className="h-5 w-5 text-green-500" />, title: "Usuario Activado", description: "Carlos López ahora tiene acceso al sistema.", timestamp: timeAgo(new Date(Date.now() - 15 * 60 * 1000)), read: false },
  { id: "3", icon: <FilePenLine className="h-5 w-5 text-orange-500" />, title: "Autoregistro Pendiente", description: "Un visitante (ID: AR-123) espera aprobación.", timestamp: timeAgo(new Date(Date.now() - 60 * 60 * 1000)), read: true },
  { id: "4", icon: <AlarmClockOff className="h-5 w-5 text-red-500" />, title: "Visita Prolongada", description: "Luis Torres (Sede Norte) lleva 25 horas activo.", timestamp: timeAgo(new Date(Date.now() - 2 * 60 * 60 * 1000)), read: false },
];

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual es requerida."),
  newPassword: z.string().min(6, "Nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirmación de contraseña es requerida."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmPassword"],
});
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AppHeader() {
  const { toast } = useToast();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Simulated user data
  const currentUser = {
    name: "Admin Usuario", // Placeholder
    role: "Admin Principal", // Placeholder, can be 'Admin Principal', 'Administrador', 'Estándar'
    avatarUrl: "", // Placeholder for avatar image URL
    initials: "AU"
  };

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted) {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(storedTheme === 'dark' || (!storedTheme && prefersDark));
    }
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDark, isMounted]);
  
  useEffect(() => {
    // Simulate fetching notifications
    setNotifications(MOCK_NOTIFICATIONS);
  }, []);


  const toggleDarkMode = () => { if (isMounted) setIsDark(prev => !prev); };
  const handleClearNotifications = () => { setNotifications([]); };
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    toast({ title: "Cerrando Sesión", description: "Has cerrado sesión exitosamente." });
    // In a real app, clear auth token here
    router.push("/login");
  };

  const handleChangePhoto = () => {
    toast({ title: "Cambiar Foto de Perfil", description: "Esta función aún no está implementada." });
  };

  const onSubmitPasswordChange: SubmitHandler<ChangePasswordFormData> = async (data) => {
    setIsSubmittingPassword(true);
    console.log("Password change data:", data); // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Contraseña Cambiada", description: "Tu contraseña ha sido actualizada (simulado)." });
    setIsSubmittingPassword(false);
    setIsChangePasswordOpen(false);
    passwordForm.reset();
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between">
        <div className="flex items-center gap-2 pl-4 md:pl-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold text-foreground md:text-xl">Registro de Visitantes</h1>
        </div>
        <div className="flex items-center gap-3 pr-4 md:pr-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            disabled={!isMounted}
          >
            {isMounted ? (isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : (<span className="h-5 w-5 block" />)}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-5 w-5" />
                {isMounted && unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96">
              <DropdownMenuLabel className="flex justify-between items-center">
                Notificaciones
                <div className="flex items-center gap-2">
                  <Label htmlFor="notifications-toggle" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    {notificationsEnabled ? "Activadas" : "Desactivadas"}
                  </Label>
                  <Switch
                    id="notifications-toggle"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    aria-label="Toggle notifications"
                    className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span[data-state=checked]]:translate-x-3 [&>span[data-state=unchecked]]:translate-x-0.5"
                  />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px] p-1">
                {isMounted && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`p-2 rounded-md mb-1 ${!notification.read ? 'bg-primary/5' : 'opacity-75 hover:bg-muted/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">{notification.icon}</div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground/80 mt-0.5">{notification.timestamp}</p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" title="No leída"></div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No hay notificaciones nuevas.</p>
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleClearNotifications}
                    className="flex items-center justify-center text-sm text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Todas las Notificaciones
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="User Profile">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{currentUser.initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleChangePhoto}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Cambiar Foto de Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Cambiar Contraseña</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>Actualice su contraseña. Asegúrese de que sea segura.</DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)} className="space-y-4 py-2">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
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
                control={passwordForm.control}
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
                  <Button type="button" variant="outline" disabled={isSubmittingPassword}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cambiar Contraseña
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </header>
  );
}

    