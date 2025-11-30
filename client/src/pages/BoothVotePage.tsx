import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StaffHeader from "@/components/StaffHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface PollOption {
  _id: string;
  optionText: string;
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  userVoteOptionId?: string | null;
}

function getRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role || null;
  } catch {
    return null;
  }
}

export default function BoothVotePage() {
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);

  const role = getRoleFromToken();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchPolls = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/polls/active`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(
              0,
              80
            )}...`
          );
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || "Failed to fetch polls");
        }

        const list: Poll[] = Array.isArray(body.data) ? body.data : [];
        setPolls(list);

        const initialSelections: Record<string, string> = {};
        for (const poll of list) {
          if (poll.userVoteOptionId) {
            initialSelections[poll._id] = poll.userVoteOptionId;
          }
        }
        setSelectedOptions(initialSelections);
      } catch (err: any) {
        setError(err.message || "Failed to load polls");
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const handleSelect = (pollId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [pollId]: optionId }));
  };

  const handleVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      toast({
        title: "No option selected",
        description: "Please select a vendor option before voting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingPollId(pollId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ optionId }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(
            0,
            80
          )}...`
        );
      }

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || "Failed to submit vote");
      }

      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded for this booth poll.",
      });

      // Update local polls with server response
      const updatedPoll = body.data as Poll;
      setPolls((prev) =>
        prev.map((p) =>
          p._id === updatedPoll._id ? { ...p, ...updatedPoll } : p
        )
      );
    } catch (err: any) {
      toast({
        title: "Failed to submit vote",
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while voting.",
        variant: "destructive",
      });
    } finally {
      setSubmittingPollId(null);
    }
  };

  const renderHeader = () => {
    if (role === "professor") return <ProfessorHeader />;
    if (role === "staff" || role === "ta") return <StaffHeader />;
    return <Header showHomeTop homeHref="/home" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Booth Vote</h1>
          <p className="text-muted-foreground">
            Vote for the vendor you would like to see setting up a booth on
            campus.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading polls...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : polls.length === 0 ? (
          <p className="text-muted-foreground">
            There are no active booth polls at the moment.
          </p>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <Card key={poll._id}>
                <CardHeader>
                  <CardTitle>{poll.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={selectedOptions[poll._id] || ""}
                    onValueChange={(val) => handleSelect(poll._id, val)}
                  >
                    {poll.options.map((opt) => (
                      <div
                        key={opt._id}
                        className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50"
                      >
                        <RadioGroupItem
                          value={opt._id}
                          id={`${poll._id}-${opt._id}`}
                        />
                        <Label
                          htmlFor={`${poll._id}-${opt._id}`}
                          className="cursor-pointer"
                        >
                          {opt.optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleVote(poll._id)}
                      disabled={submittingPollId === poll._id}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2 text-sm font-semibold rounded-lg"
                    >
                      {submittingPollId === poll._id
                        ? "Submitting..."
                        : "Submit Vote"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
