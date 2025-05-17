
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
import { Building, Home, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppHeader from './app-header';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/visitors", label: "Visitantes", icon: Users },
    { href: "/settings", label: "Configuración", icon: Settings },
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
                    isActive={pathname === item.href}
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
