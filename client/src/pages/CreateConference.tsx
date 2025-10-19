import { useState } from "react";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import CreateEventForm, { CreateEventFormValues } from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function CreateConference() {
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: CreateEventFormValues) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: values.name,
        startDate: `${values.startDate}T${values.startTime}:00.000Z`,
        endDate: `${values.endDate}T${values.endTime}:00.000Z`,
        description: values.description,
        websiteUrl: values.websiteUrl || "https://example.com",
        requiredBudget: values.requiredBudget ? Number(values.requiredBudget) : 1000,
        fundingSource: values.fundingSource || "guc",
        agenda: values.agenda || "Conference agenda to be determined",
      };

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
      if (!res.ok) throw new Error(data.message || "Failed to create conference");

      setLocation("/events-office/dashboard");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Create Conference</h1>
            <Button variant="outline" onClick={() => setLocation("/events-office/dashboard")}>
              Back to Events Office
            </Button>
          </div>
          <p className="text-muted-foreground">
            Create a new conference. The conference website will contain all the conference's details.
          </p>
        </div>

        <CreateEventForm
          onSubmit={handleSubmit}
          submitting={submitting}
          includeWebsiteUrl
          includeBudgetAndFunding
          includeAgenda
          submitLabel="Create Conference"
          title="Conference Information"
        />
      </main>
    </div>
  );
}


