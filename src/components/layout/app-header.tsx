
"use client";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle, Bell, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AppHeader() {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Mock state

  // Effect to set isMounted to true only on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect to read theme preference and update isDark state (client-side only)
  useEffect(() => {
    if (isMounted) { // Only run after component is mounted
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDark(true);
      } else {
        setIsDark(false);
      }
    }
  }, [isMounted]); // Re-run if isMounted changes (e.g., from false to true)

  // Effect to apply theme class to HTML element and save preference (client-side only)
  useEffect(() => {
    if (isMounted) { // Only run after component is mounted
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDark, isMounted]); // Re-run if isDark or isMounted changes

  const toggleDarkMode = () => {
    if (isMounted) { // Ensure this only callable after mount
      setIsDark(prev => !prev);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          {/* Ensure this h1 does not cause layout shifts or content mismatches easily */}
          <h1 className="text-lg font-semibold text-foreground md:text-xl">Registro de Visitantes</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            disabled={!isMounted} // Button is disabled until mounted, server renders disabled, client initial renders disabled
          >
            {/*
              Render a placeholder of the same size initially on both server and client.
              The actual icon (Sun or Moon) is rendered only after isMounted is true.
            */}
            {isMounted ? (
              isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
            ) : (
              <span className="h-5 w-5 block" /> // Placeholder to maintain layout
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent">
                <div className="flex items-center justify-between w-full">
                  <Label htmlFor="notifications-toggle" className="font-normal cursor-pointer">
                    Activar Notificaciones
                  </Label>
                  <Switch
                    id="notifications-toggle"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    aria-label="Toggle notifications"
                  />
                </div>
              </DropdownMenuItem>
              {/* Future notification items can go here */}
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
