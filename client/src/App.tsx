import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import AdminUsers from "@/pages/AdminUsers";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import CreateConference from "@/pages/CreateConference";
import EditConference from "@/pages/EditConference";
import CreateWorkshop from "@/pages/CreateWorkshop";
import CreateTrip from "@/pages/CreateTrip";
import CreateBazaar from "@/pages/CreateBazaar";
import VendorDashboard from "@/pages/VendorDashboard";
import SportsFacilities from "@/pages/SportsFacilities";
import MyEvents from "@/pages/MyEvents";
import WorkshopApprovals from "@/pages/WorkshopApprovals";
import VendorRequests from "@/pages/VendorRequests";
import ProfessorDashboard from "@/pages/ProfessorDashboard";
import EditWorkshop from "@/pages/EditWorkshop";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/create/conference" component={CreateConference} />
      <Route path="/admin/events/conference/edit/:id" component={EditConference} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/create/workshop" component={CreateWorkshop} />
      <Route path="/professor/dashboard">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/professor/create-workshop">
        <ProtectedRoute allowedRoles={["professor"]}>
          <CreateWorkshop />
        </ProtectedRoute>
      </Route>
      <Route path="/professor/edit-workshop/:id">
        <ProtectedRoute allowedRoles={["professor"]}>
          <EditWorkshop />
        </ProtectedRoute>
      </Route>
      <Route path="/create/trip" component={CreateTrip} />
      <Route path="/create/bazaar" component={CreateBazaar} />
      <Route path="/vendor/dashboard">
        <ProtectedRoute allowedRoles={["vendor"]}>
          <VendorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/sports">
        <ProtectedRoute allowedRoles={["student", "staff", "events_office", "ta", "professor"]}>
          <SportsFacilities />
        </ProtectedRoute>
      </Route>
      <Route path="/my-events" component={MyEvents} />
      <Route path="/approvals/workshops" component={WorkshopApprovals} />
      <Route path="/admin/vendor-requests" component={VendorRequests} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
