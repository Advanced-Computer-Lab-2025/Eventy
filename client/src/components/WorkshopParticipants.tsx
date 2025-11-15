import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Participant {
  _id: string;
  name: string;
  email: string;
}

interface Props {
  workshopId: string;
}

const WorkshopParticipants: React.FC<Props> = ({ workshopId }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remainingSpots, setRemainingSpots] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const baseUrl =
          (import.meta as any).env.VITE_API_URL || "http://localhost:4000";
        const res = await axios.get(
          `${baseUrl}/api/events/workshops/${workshopId}/participants`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        setParticipants(res.data.data.participants);
        setRemainingSpots(res.data.data.remainingSpots);
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch participants");
      }
      setLoading(false);
    };
    fetchData();
  }, [workshopId]);

  if (loading) {
    return (
      <div className="mt-4 p-4 text-center text-sm text-muted-foreground">
        Loading participants...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants
        </h3>
        <Badge variant={remainingSpots > 0 ? "secondary" : "destructive"}>
          {remainingSpots} remaining
        </Badge>
      </div>

      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No participants yet
        </p>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-3 p-2 rounded-md border text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{p.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
        Total: {participants.length}
      </div>
    </div>
  );
};

export default WorkshopParticipants;
