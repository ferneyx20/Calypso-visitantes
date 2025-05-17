
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Building, Home, Users, Settings, UsersRound, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppHeader from './app-header';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin-dashboard", label: "Dashboard", icon: Home },
    { href: "/admin-dashboard/visitors", label: "Visitantes", icon: Users },
    { href: "/admin-dashboard/employees", label: "Gestión Empleados", icon: UsersRound },
    { href: "/admin-dashboard/branches", label: "Gestión Sedes", icon: Building2 },
    // { href: "/admin-dashboard/settings", label: "Configuración", icon: Settings }, // Removed
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="sidebar" collapsible="icon" side="left" defaultOpen={true}>
        <SidebarHeader className="p-4 flex items-center gap-2">
          <Building className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Visitantes</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin-dashboard")}
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
      <SidebarInset className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
