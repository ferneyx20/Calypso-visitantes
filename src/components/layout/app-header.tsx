
"use client";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle, Bell, Sun, Moon, UserPlus, UserCheck, FilePenLine, AlarmClockOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NotificationItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  read?: boolean;
}

// Mock function to get relative time
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
  { id: "5", icon: <UserPlus className="h-5 w-5 text-blue-500" />, title: "Nuevo Visitante", description: "Pedro Martínez ha ingresado a Sede Sur.", timestamp: timeAgo(new Date(Date.now() - 5 * 60 * 60 * 1000)), read: true },
];


export default function AppHeader() {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Simulate fetching notifications
    setNotifications(MOCK_NOTIFICATIONS);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDark(true);
      } else {
        setIsDark(false);
      }
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

  const toggleDarkMode = () => {
    if (isMounted) {
      setIsDark(prev => !prev);
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold text-foreground md:text-xl">Registro de Visitantes</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            disabled={!isMounted}
          >
            {isMounted ? (
              isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
            ) : (
              <span className="h-5 w-5 block" />
            )}
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

          <Button variant="ghost" size="icon" aria-label="User Profile">
            <UserCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

    