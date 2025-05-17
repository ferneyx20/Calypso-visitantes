'use client';

// Metadata export is not allowed in Client Components.
// Page-specific metadata should be defined in individual page.tsx files within this group,
// or rely on the root layout's metadata.

import { SidebarProvider } from '@/components/ui/sidebar';
import AppShell from '@/components/layout/app-shell';

export default function AppPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppShell>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}
