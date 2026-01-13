import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/apiBase";

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreatePrivilegedUserForm({
  onSuccess,
  onCancel,
}: Props) {
  const API_BASE_URL = getApiBaseUrl();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "events_office",
    studentStaffId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(
        `${API_BASE_URL}/api/users/create-management-account`,
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to create account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Hidden dummy fields to prevent autofill */}
      <input
        type="email"
        name="fake-email"
        autoComplete="email"
        style={{ display: "none" }}
        tabIndex={-1}
      />
      <input
        type="text"
        name="fake-username"
        autoComplete="username"
        style={{ display: "none" }}
        tabIndex={-1}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="ex: Mervat"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            minLength={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="ex: Abulkheir"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            minLength={2}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentStaffId">
          ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="studentStaffId"
          name="staff-identifier"
          type="text"
          placeholder="ex: ac-1234"
          value={form.studentStaffId}
          onChange={(e) => setForm({ ...form, studentStaffId: e.target.value })}
          autoComplete="off"
          data-form-type="other"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="ex: admin@guc.edu.eg"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          pattern="^[A-Za-z0-9._%-]+@guc\.edu\.eg$"
          title="Email must end with @guc.edu.eg (e.g., admin@guc.edu.eg or john.smith@guc.edu.eg)"
          required
        />
        <p className="text-xs text-muted-foreground">
          Any valid email ending with @guc.edu.eg
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.role}
          onValueChange={(value: "admin" | "events_office") =>
            setForm({ ...form, role: value })
          }
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="events_office">Events Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
        <p className="text-sm text-muted-foreground">
          Password must be at least 8 characters.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
