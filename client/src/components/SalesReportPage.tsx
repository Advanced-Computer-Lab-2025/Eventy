import { useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import SalesReport from "./ui/SalesReport";

export default function SalesReportPage() {
  const getRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.role) return user.role;
      return localStorage.getItem("role"); // fallback if you store role separately
    } catch {
      return null;
    }
  };
  const [role] = useState<string | null>(getRole());
  return (
    <div className="min-h-screen bg-background">
      {role === "admin" ? <AdminHeader /> : <EventsOfficeHeader />}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-muted-foreground">
            Overview of sales across all events
          </p>
        </div>
        <SalesReport />
      </main>
    </div>
  );
}
