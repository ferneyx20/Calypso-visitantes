
"use client";
import type { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Users, Settings, UsersRound, Building2, ListChecks, History, Clipboard } from "lucide-react"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppHeader from './app-header';

interface AppShellProps {
  children: ReactNode;
  userRole: 'Admin' | 'Estándar'; // Definir los roles esperados
}

export default function AppShell({ children, userRole }: AppShellProps) {
  const pathname = usePathname();

  const allMenuItems = [
    { href: "/admin-dashboard", label: "Dashboard", icon: Home, adminOnly: false, standardPath: "/standard-dashboard" },
    { href: "/admin-dashboard/visitors", label: "Visitantes", icon: Users, adminOnly: false, standardPath: "/standard-dashboard/visitors" },
    { href: "/admin-dashboard/consultas", label: "Consultas", icon: History, adminOnly: false, standardPath: "/standard-dashboard/consultas" }, 
    { href: "/admin-dashboard/employees", label: "Gestión Empleados", icon: UsersRound, adminOnly: true },
    { href: "/admin-dashboard/branches", label: "Gestión Sedes", icon: Building2, adminOnly: true },
    { href: "/admin-dashboard/user-management", label: "Gestión Usuarios", icon: Settings, adminOnly: true },
    { href: "/admin-dashboard/list-management", label: "Gestión de Listas", icon: ListChecks, adminOnly: true },
  ];

  const menuItems = userRole === 'Estándar'
    ? allMenuItems.filter(item => !item.adminOnly).map(item => ({...item, href: item.standardPath || item.href }))
    : allMenuItems;

  // Determinar el prefijo de la ruta base según el rol para la lógica de isActive
  const basePath = userRole === 'Estándar' ? '/standard-dashboard' : '/admin-dashboard';

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="sidebar" collapsible="icon" side="left" defaultOpen={false}>
        <SidebarHeader className="p-4 flex items-center gap-2">
          <Clipboard className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Calypso del Caribe</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={
                      pathname === item.href || 
                      (pathname.startsWith(item.href) && item.href !== basePath && item.href.length > basePath.length) ||
                      (pathname === basePath && item.href === basePath)
                    }
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 py-4 md:py-6 lg:py-8 px-4 md:px-6 lg:px-8">
        <AppHeader />
        <main className="flex flex-col flex-1 pt-4"> {/* Añadido pt-4 para separar del header */}
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

