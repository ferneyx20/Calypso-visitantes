
import DashboardSummary from "@/components/dashboard/dashboard-summary";
import { Home } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Home className="mr-3 h-8 w-8 text-primary" />
          Panel de Control
        </h1>
        {/* Optional: Add a button or quick action here if needed */}
      </div>
      <DashboardSummary />
      {/* VisitorRegistrationForm was removed from here as its functionality is now in /visitors page */}
    </div>
  );
}
