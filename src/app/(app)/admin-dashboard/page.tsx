
import VisitorRegistrationForm from "@/components/visitor/visitor-registration-form";
import DashboardSummary from "@/components/dashboard/dashboard-summary";

export default function AdminDashboardPage() { // Renamed component
  return (
    <div className="container mx-auto space-y-8">
      <DashboardSummary />
      <VisitorRegistrationForm />
    </div>
  );
}
