import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage events and administrative tasks</p>
        </div>

        <div className="grid gap-4">
          <Button onClick={() => setLocation("/admin/create/conference")} className="w-full">
            Create Conference
          </Button>
        </div>
      </main>
    </div>
  );
}


