
import DashboardSummary from "@/components/dashboard/dashboard-summary";
import { Home } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="w-full flex flex-col flex-1 space-y-8"> {/* Changed container mx-auto to w-full flex flex-col flex-1 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Home className="mr-3 h-8 w-8 text-primary" />
          Panel de Control
        </h1>
        {/* Optional: Add a button or quick action here if needed */}
      </div>
      {/* Ensure DashboardSummary and its internal cards can also expand if needed */}
      <DashboardSummary userRole="Admin" />
      {/* VisitorRegistrationForm was removed from here as its functionality is now in /visitors page */}
    </div>
  );
}

    