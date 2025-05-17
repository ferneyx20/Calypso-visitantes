
import DashboardSummary from "@/components/dashboard/dashboard-summary";
import { Home } from "lucide-react";

export default function StandardDashboardPage() {
  return (
    <div className="w-full flex flex-col flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Home className="mr-3 h-8 w-8 text-primary" />
          Panel de Control Estándar
        </h1>
      </div>
      <DashboardSummary userRole="Estándar" />
    </div>
  );
}

    