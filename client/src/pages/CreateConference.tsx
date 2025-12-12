import { useState } from "react";
import { format } from "date-fns";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import CreateEventForm, {
  CreateEventFormValues,
} from "@/components/CreateEventForm";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function CreateConference() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    values: CreateEventFormValues,
    professors?: string[]
  ) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      // Build payload with merged ISO dates and separate time fields
      const startTimeValue =
        values.startTime && values.startTime.trim()
          ? values.startTime.trim()
          : "00:00";
      const endTimeValue =
        values.endTime && values.endTime.trim()
          ? values.endTime.trim()
          : "00:00";

      const payload: any = {
        name: values.name,
        startDate: values.startDate
          ? `${format(values.startDate, "yyyy-MM-dd")}T${startTimeValue}:00.000Z`
          : "",
        endDate: values.endDate
          ? `${format(values.endDate, "yyyy-MM-dd")}T${endTimeValue}:00.000Z`
          : "",
        startTime: startTimeValue, // Required by backend model
        endTime: endTimeValue, // Required by backend model
        description: values.description,
        websiteUrl: values.websiteUrl || "https://example.com",
        requiredBudget: values.requiredBudget
          ? Number(values.requiredBudget)
          : 1000,
        fundingSource: values.fundingSource || "guc",
        agenda: values.agenda || "Conference agenda to be determined",
        professors: professors || [],
      };

      // Add restricted roles if provided
      if (values.restrictedRoles && values.restrictedRoles.length > 0) {
        payload.restrictedRoles = values.restrictedRoles;
      }

      const res = await fetch(`${API_BASE_URL}/api/events/admin/conferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create conference");

      toast({
        title: "Conference created",
        description: "The conference was created successfully.",
      });

      // Small delay to allow toast to be visible before redirect
      setTimeout(() => {
        setLocation("/events-office/dashboard");
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Failed to create conference",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Conference</h1>
          <p className="text-muted-foreground">
            Create a new conference. The conference website will contain all the
            conference's details.
          </p>
        </div>

        <CreateEventForm
          onSubmit={handleSubmit}
          submitting={submitting}
          includeWebsiteUrl
          includeBudgetAndFunding
          includeAgenda
          includeProfessors
          submitLabel="Create Conference"
          title="Conference Information"
          onCancel={() => setLocation("/events-office/dashboard")}
        />
      </main>
    </div>
  );
}
