
'use client';

import AppShell from '@/components/layout/app-shell';

export default function StandardDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell userRole="Estándar">
      {children}
    </AppShell>
  );
}
