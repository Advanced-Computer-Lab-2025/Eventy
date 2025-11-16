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
import WorkshopManagement from "@/pages/WorkshopManagement";
import ProfessorSubmissions from "@/pages/ProfessorSubmissions";
import EditWorkshop from "@/pages/EditWorkshop";
import EventsOfficeDashboard from "@/pages/EventsOfficeDashboard";
import StaffTADashboard from "@/pages/StaffTADashboard";
import NotFound from "@/pages/not-found";
import EmailVerified from "@/pages/EmailVerified";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventListPage from "@/pages/EventListPage";
import StaffUpcomingEvents from "@/pages/StaffUpcomingEvents";
import ArchivedEvents from "@/pages/ArchivedEvents";

import EventsOfficeReportPage from "@/pages/EventsReportPage";
function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route path="/verify-email/:token" component={EmailVerified} />
      <Route path="/dashboard" component={Dashboard} />

      <Route path="/home">
        <ProtectedRoute allowedRoles={["student"]}>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/events-office/create/conference">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <CreateConference />
        </ProtectedRoute>
      </Route>
      <Route path="/events-office/events/conference/edit/:id">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <EditConference />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/create/workshop" component={CreateWorkshop} />
      <Route path="/professor">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/professor/workshops">
        <ProtectedRoute allowedRoles={["professor"]}>
          <WorkshopManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/professor/submissions">
        <ProtectedRoute allowedRoles={["professor"]}>
          <ProfessorSubmissions />
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
      <Route path="/create/trip">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <CreateTrip />
        </ProtectedRoute>
      </Route>
      <Route path="/staff-ta">
        <ProtectedRoute allowedRoles={["staff", "ta"]}>
          <StaffTADashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/staff-ta/upcoming">
        <ProtectedRoute allowedRoles={["staff", "ta"]}>
          <StaffUpcomingEvents />
        </ProtectedRoute>
      </Route>

      <Route path="/create/bazaar" component={CreateBazaar} />
      <Route path="/vendor/dashboard">
        <ProtectedRoute allowedRoles={["vendor"]}>
          <VendorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/events-office/dashboard">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <EventsOfficeDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/events-office/archived">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <ArchivedEvents />
        </ProtectedRoute>
      </Route>

      <Route path="/sports">
        <ProtectedRoute
          allowedRoles={[
            "student",
            "staff",
            "events_office",
            "ta",
            "professor",
          ]}
        >
          <SportsFacilities />
        </ProtectedRoute>
      </Route>

      <Route path="/approvals/workshops">
        <ProtectedRoute allowedRoles={["events_office"]}>
          <WorkshopApprovals />
        </ProtectedRoute>
      </Route>

      <Route path="/my-events">
        <ProtectedRoute
          allowedRoles={[
            "student",
            "staff",
            "events_office",
            "ta",
            "professor",
          ]}
        >
          <MyEvents />
        </ProtectedRoute>
      </Route>

      <Route path="/approvals/workshops" component={WorkshopApprovals} />
      <Route path="/vendor-requests">
        <ProtectedRoute allowedRoles={["admin", "events_office"]}>
          <VendorRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/events" component={EventListPage} />
      <Route path="/reports/attendees">
        <ProtectedRoute allowedRoles={["events_office", "admin"]}>
          <EventsOfficeReportPage />
        </ProtectedRoute>
      </Route>
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
