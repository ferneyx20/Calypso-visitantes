import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Registro de Visitantes',
  description: 'Página de inicio de sesión para el sistema de registro de visitantes.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is minimal, it doesn't include AppShell or Sidebar
  return <>{children}</>;
}
