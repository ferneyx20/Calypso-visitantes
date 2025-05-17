
'use client';

// Metadata export is not allowed in Client Components for route group layouts.
// Page-specific metadata should be defined in individual page.tsx files within this group.

import AppShell from '@/components/layout/app-shell';

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell userRole="Admin">
      {children}
    </AppShell>
  );
}
