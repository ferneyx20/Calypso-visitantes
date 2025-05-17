
'use client';

// Metadata export is not allowed in Client Components.
// Page-specific metadata should be defined in individual page.tsx files within this group,
// or rely on the root layout's metadata.

import { SidebarProvider } from '@/components/ui/sidebar';
// AppShell se moverá a los layouts específicos de admin-dashboard y standard-dashboard

export default function AppPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      {/* AppShell ya no se renderiza aquí directamente. 
          Se renderizará en /admin-dashboard/layout.tsx y /standard-dashboard/layout.tsx */}
      {children}
    </SidebarProvider>
  );
}
