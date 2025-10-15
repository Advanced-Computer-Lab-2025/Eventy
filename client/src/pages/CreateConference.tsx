import { useState } from "react";
import Header from "@/components/Header";
import CreateEventForm, { CreateEventFormValues } from "@/components/CreateEventForm";
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
        websiteUrl: values.websiteUrl || undefined,
        requiredBudget: values.requiredBudget ? Number(values.requiredBudget) : undefined,
        fundingSource: values.fundingSource,
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

      setLocation("/dashboard");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Conference</h1>
          <p className="text-muted-foreground">
            Create a new conference. The conference website will contain all the conference's details.
          </p>
        </div>

        <CreateEventForm
          onSubmit={handleSubmit}
          submitting={submitting}
          includeWebsiteUrl
          includeBudgetAndFunding
          submitLabel="Create Conference"
          title="Conference Information"
        />
      </main>
    </div>
  );
}


