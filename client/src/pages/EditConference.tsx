import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import CreateEventForm, {
  CreateEventFormValues,
} from "@/components/CreateEventForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

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
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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

      // Build payload with merged ISO dates and separate time fields
      const startTimeValue =
        values.startTime && values.startTime.trim()
          ? values.startTime.trim()
          : "00:00";
      const endTimeValue =
        values.endTime && values.endTime.trim()
          ? values.endTime.trim()
          : "00:00";
      const isValidDate = (d: unknown): d is Date =>
        d instanceof Date && !Number.isNaN(d.getTime());

      if (!isValidDate(values.startDate) || !isValidDate(values.endDate)) {
        toast({
          title: "Invalid date",
          description: "Start date and end date must be valid.",
          variant: "destructive",
        });
        return;
      }

      const payload: any = {
        name: values.name,
        startDate: `${format(values.startDate, "yyyy-MM-dd")}T${startTimeValue}:00.000Z`,
        endDate: `${format(values.endDate, "yyyy-MM-dd")}T${endTimeValue}:00.000Z`,
        startTime: startTimeValue, // Required by backend model
        endTime: endTimeValue, // Required by backend model
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

      toast({
        title: "Conference updated",
        description: "The conference was updated successfully.",
      });

      // Small delay to allow toast to be visible before redirect
      setTimeout(() => {
        setLocation("/events-office/dashboard");
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Failed to update conference",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    // Extract HH:mm from ISO string (format: "2025-11-26T16:26:00.000Z")
    const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : "";
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
    startDate: (() => {
      if (!conference.startDate) return undefined;
      const d = new Date(conference.startDate);
      return Number.isNaN(d.getTime()) ? undefined : d;
    })(),
    // Use separate startTime field if available, otherwise extract from date
    startTime:
      (conference as any).startTime ?? formatTimeForInput(conference.startDate),
    endDate: (() => {
      if (!conference.endDate) return undefined;
      const d = new Date(conference.endDate);
      return Number.isNaN(d.getTime()) ? undefined : d;
    })(),
    // Use separate endTime field if available, otherwise extract from date
    endTime:
      (conference as any).endTime ?? formatTimeForInput(conference.endDate),
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
          <h1 className="text-4xl font-bold mb-2">Edit Conference</h1>
          <p className="text-muted-foreground">
            Update conference details. The conference website will contain all
            the conference&apos;s details.
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
          hideSubmitButton={true}
          formId="edit-conference-form"
        />

        <div className="flex justify-end gap-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            disabled={submitting}
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-conference-form"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? "Updating..." : "Update Conference"}
          </Button>
        </div>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to discard your changes and return to the Events
                Office dashboard? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setLocation("/events-office/dashboard")}
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
