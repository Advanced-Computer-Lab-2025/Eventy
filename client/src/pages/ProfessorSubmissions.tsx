import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import ProfessorHeader from "@/components/ProfessorHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

type Submission = {
  _id?: string;
  workshopId?: string;
  name?: string;
  status?: string;
  requestedEdits?: string;
  revisionComments?: string;
  submissionDate?: string | Date;
};

export default function ProfessorSubmissions() {
  const [, setLocation] = useLocation();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(
    () => (import.meta as any).env.VITE_API_URL || "http://localhost:4000",
    []
  );

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userRaw = localStorage.getItem("user");

        if (!userRaw) {
          setLocation("/login");
          return;
        }

        const user = JSON.parse(userRaw);
        const professorId = user?._id || user?.id;

        // First try the dedicated submissions endpoint
        let res = await fetch(`${baseUrl}/api/workshops/${professorId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        // If not found or not ok, fall back to existing endpoint
        if (!res.ok) {
          res = await fetch(`${baseUrl}/api/events/me/workshops`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        }

        if (!res.ok) {
          const msg = `Failed to load submissions (${res.status})`;
          throw new Error(msg);
        }

        const data = await res.json();
        // Normalize: some endpoints return { data: [...] }
        const items: Submission[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        // Filter to show only pending and needs_revision workshops
        const filtered = (items || []).filter((item) => {
          const status = (item.status || "").toLowerCase();
          return status === "pending" || status === "needs_revision";
        });

        setSubmissions(filtered);
      } catch (e: any) {
        setError(e?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  const formatDate = (d?: string | Date) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const statusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    const map: Record<string, { className: string; label: string }> = {
      pending: {
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        label: "Pending",
      },
      approved: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        label: "Approved",
      },
      rejected: {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        label: "Rejected",
      },
      needs_revision: {
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        label: "Needs Revision",
      },
      submitted: {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        label: "Submitted",
      },
      "under review": {
        className:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        label: "Under Review",
      },
    };
    const cfg = map[s] || map["pending"];
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfessorHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Workshop Submissions</h1>
            <p className="text-muted-foreground">
              View pending submissions and any requested edits for your
              workshops
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-muted-foreground">Loading submissions...</div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No submissions found
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first workshop to get started
              </p>
              <Button onClick={() => setLocation("/professor/create-workshop")}>
                Create Workshop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((s, idx) => {
              const id = s._id || String(idx);
              const title = s.name || s.workshopId || `Submission #${idx + 1}`;
              const status = s.status;
              const edits = s.requestedEdits || s.revisionComments;
              return (
                <Card key={id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <CardTitle className="text-xl line-clamp-1">
                      {title}
                    </CardTitle>
                    {statusBadge(status)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {s.submissionDate && (
                        <div>Submitted: {formatDate(s.submissionDate)}</div>
                      )}
                    </div>
                    {edits && (
                      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          Requested Edits
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                          {edits}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
