
// This file is no longer the root of the (app) group.
// Its content has been moved to /src/app/(app)/admin-dashboard/page.tsx
// This file can be removed if it's not automatically handled by deleting the old route.
// For now, leaving it empty or with a comment.
// Or redirecting, but src/app/page.tsx already handles the root redirect.

export default function AppPage() {
    return null; 
    // Or, if you want to be explicit and ensure this path doesn't render anything:
    // import { notFound } from 'next/navigation';
    // notFound();
}
