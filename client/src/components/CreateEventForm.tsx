import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface CreateEventFormValues {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  websiteUrl?: string;
  requiredBudget?: string;
  fundingSource?: "external" | "guc";
  agenda?: string;
}

interface CreateEventFormProps {
  onSubmit: (values: CreateEventFormValues) => Promise<void> | void;
  submitting?: boolean;
  includeWebsiteUrl?: boolean;
  includeBudgetAndFunding?: boolean;
  includeAgenda?: boolean;
  submitLabel?: string;
  title?: string;
  initialValues?: Partial<CreateEventFormValues>;
}

export default function CreateEventForm({
  onSubmit,
  submitting = false,
  includeWebsiteUrl = true,
  includeBudgetAndFunding = true,
  includeAgenda = true,
  submitLabel = "Create",
  title = "Event Information",
  initialValues = {},
}: CreateEventFormProps) {
  const [values, setValues] = useState<CreateEventFormValues>({
    name: initialValues.name || "",
    startDate: initialValues.startDate || "",
    startTime: initialValues.startTime || "",
    endDate: initialValues.endDate || "",
    endTime: initialValues.endTime || "",
    description: initialValues.description || "",
    websiteUrl: initialValues.websiteUrl || "",
    requiredBudget: initialValues.requiredBudget || "",
    fundingSource: initialValues.fundingSource || undefined,
    agenda: initialValues.agenda || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = "Name is required";
    if (!values.startDate) nextErrors.startDate = "Start date is required";
    if (!values.startTime) nextErrors.startTime = "Start time is required";
    if (!values.endDate) nextErrors.endDate = "End date is required";
    if (!values.endTime) nextErrors.endTime = "End time is required";
    if (!values.description.trim()) nextErrors.description = "Description is required";

    if (includeWebsiteUrl && values.websiteUrl) {
      try {
        // Basic URL format validation
        // eslint-disable-next-line no-new
        new URL(values.websiteUrl);
      } catch {
        nextErrors.websiteUrl = "Enter a valid URL (including protocol)";
      }
    }

    if (includeAgenda && !values.agenda?.trim()) {
      nextErrors.agenda = "Agenda is required";
    }

    if (includeBudgetAndFunding) {
      if (!values.requiredBudget || Number(values.requiredBudget) <= 0) {
        nextErrors.requiredBudget = "Required budget must be a positive number";
      }
      if (!values.fundingSource) {
        nextErrors.fundingSource = "Select a funding source";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., International AI Conference"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => setValues({ ...values, startDate: e.target.value })}
                required
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={values.startTime}
                onChange={(e) => setValues({ ...values, startTime: e.target.value })}
                required
              />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={values.endDate}
                onChange={(e) => setValues({ ...values, endDate: e.target.value })}
                required
              />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={values.endTime}
                onChange={(e) => setValues({ ...values, endTime: e.target.value })}
                required
              />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a short description of the conference..."
              rows={4}
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              required
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {includeWebsiteUrl && (
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Conference Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.org"
                value={values.websiteUrl || ""}
                onChange={(e) => setValues({ ...values, websiteUrl: e.target.value })}
                required
              />
              {errors.websiteUrl && (
                <p className="text-sm text-red-500">{errors.websiteUrl}</p>
              )}
            </div>
          )}

          {includeAgenda && (
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Provide a detailed agenda for the conference..."
                rows={4}
                value={values.agenda || ""}
                onChange={(e) => setValues({ ...values, agenda: e.target.value })}
                required
              />
              {errors.agenda && (
                <p className="text-sm text-red-500">{errors.agenda}</p>
              )}
            </div>
          )}

          {includeBudgetAndFunding && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredBudget">Required Budget (EGP)</Label>
                <Input
                  id="requiredBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000"
                  value={values.requiredBudget || ""}
                  onChange={(e) => setValues({ ...values, requiredBudget: e.target.value })}
                />
                {errors.requiredBudget && (
                  <p className="text-sm text-red-500">{errors.requiredBudget}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingSource">Funding Source</Label>
                <select
                  id="fundingSource"
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={values.fundingSource || ""}
                  onChange={(e) =>
                    setValues({ ...values, fundingSource: e.target.value as any })
                  }
                >
                  <option value="" disabled>
                    Select source
                  </option>
                  <option value="external">External</option>
                  <option value="guc">GUC</option>
                </select>
                {errors.fundingSource && (
                  <p className="text-sm text-red-500">{errors.fundingSource}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}


