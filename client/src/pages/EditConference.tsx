import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import CreateEventForm, {
  CreateEventFormValues,
} from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface Conference {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  websiteUrl?: string;
  requiredBudget?: number;
  fundingSource?: "external" | "guc";
  extraResources?: string;
  agenda?: string;
  restrictedRoles?: string[];
}

export default function EditConference() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/events-office/events/conference/edit/:id");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conference, setConference] = useState<Conference | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conferenceId = params?.id;

  useEffect(() => {
    if (!conferenceId) {
      setError("Conference ID not found");
      setLoading(false);
      return;
    }

    const fetchConference = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/events/admin/conferences/${conferenceId}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        );

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Unexpected response (${res.status}). Preview: ${text.substring(0, 120)}...`
          );
        }

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch conference");

        setConference(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load conference");
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [conferenceId]);

  const handleSubmit = async (values: CreateEventFormValues) => {
    if (!conferenceId) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const payload: any = {
        name: values.name,
        startDate: `${values.startDate}T${values.startTime}:00.000Z`,
        endDate: `${values.endDate}T${values.endTime}:00.000Z`,
        description: values.description,
        websiteUrl: values.websiteUrl || "https://example.com",
        requiredBudget: values.requiredBudget
          ? Number(values.requiredBudget)
          : 1000,
        fundingSource: values.fundingSource || "guc",
        agenda: values.agenda || "Conference agenda to be determined",
      };

      // Always send restrictedRoles when editing (even if empty) to clear restrictions
      payload.restrictedRoles = values.restrictedRoles || [];

      const res = await fetch(
        `${API_BASE_URL}/api/events/admin/conferences/${conferenceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Unexpected response (${res.status}). Preview: ${text.substring(0, 120)}...`
        );
      }

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to update conference");

      setLocation("/events-office/dashboard");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  const formatTimeForInput = (dateString: string) => {
    return new Date(dateString).toTimeString().slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <EventsOfficeHeader />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading conference...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !conference) {
    return (
      <div className="min-h-screen bg-background">
        <EventsOfficeHeader />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">
                {error || "Conference not found"}
              </p>
              <Button onClick={() => setLocation("/events-office/dashboard")}>
                Back to Events Office Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const initialValues: Partial<CreateEventFormValues> = {
    name: conference.name,
    startDate: formatDateForInput(conference.startDate),
    startTime: formatTimeForInput(conference.startDate),
    endDate: formatDateForInput(conference.endDate),
    endTime: formatTimeForInput(conference.endDate),
    description: conference.description,
    websiteUrl: conference.websiteUrl || "",
    requiredBudget: conference.requiredBudget?.toString() || "",
    fundingSource: conference.fundingSource,
    agenda: conference.agenda || "",
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Edit Conference</h1>
            <Button
              variant="outline"
              onClick={() => setLocation("/events-office/dashboard")}
            >
              Back to Events Office
            </Button>
          </div>
          <p className="text-muted-foreground">
            Update conference details. The conference website will contain all
            the conference's details.
          </p>
        </div>

        <CreateEventForm
          onSubmit={handleSubmit}
          submitting={submitting}
          includeWebsiteUrl
          includeBudgetAndFunding
          includeAgenda
          submitLabel="Update Conference"
          title="Conference Information"
          initialValues={initialValues}
        />
      </main>
    </div>
  );
}
