
"use client"; // Required for useState and useEffect

import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const toggleDarkMode = () => {
    if (isMounted) setIsDark(prev => !prev);
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Dark mode toggle button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label="Toggle theme"
          disabled={!isMounted}
          className="text-foreground hover:bg-muted/50"
        >
          {isMounted ? (isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : (<span className="h-5 w-5 block" />)}
        </Button>
      </div>

      {/* Left Panel */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-card text-foreground lg:flex"
        style={{ backgroundColor: 'hsl(var(--calypso-red))' }}
      >
        <div className="absolute inset-0 bg-black opacity-25" /> {/* Optional overlay */}
        <div className="z-10 text-center p-8">
          <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--primary-foreground))' }}>
            GESTIÓN DE <span className="font-semibold">VISITANTES</span>
          </h1>
          <p className="mt-3 text-lg" style={{ color: 'hsl(var(--primary-foreground))' }}>
            Eficiencia y seguridad en el acceso.
          </p>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="mb-10 flex justify-center">
          <Image
            src="/images/pelican_logo.png"
            alt="Logo de la Empresa"
            width={120}
            height={120}
            priority
            data-ai-hint="pelican logo"
          />
        </div>
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-3xl font-semibold text-foreground">
            Iniciar sesión
          </h2>
          <p className="mb-8 text-muted-foreground">
            Bienvenido de nuevo. Por favor, ingrese sus credenciales.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
