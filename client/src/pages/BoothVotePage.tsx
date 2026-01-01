import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StaffHeader from "@/components/StaffHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import StudentHeader from "@/components/StudentHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

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

export default function BoothVotePage() {
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const role = (parsed?.role || "").toLowerCase();
        setUserRole(role);
      }
    } catch (err) {
      logger.error("Error parsing user data:", err);
    }
  }, []);

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

    const currentPoll = polls.find((p) => p._id === pollId);
    const wasChangingVote = !!currentPoll?.userVoteOptionId;
    const previousVoteId = currentPoll?.userVoteOptionId;

    // Optimistic update - update UI immediately
    setPolls((prev) =>
      prev.map((p) =>
        p._id === pollId ? { ...p, userVoteOptionId: optionId } : p
      )
    );

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
        // Revert optimistic update on error
        setPolls((prev) =>
          prev.map((p) =>
            p._id === pollId
              ? { ...p, userVoteOptionId: previousVoteId || undefined }
              : p
          )
        );
        throw new Error(body.message || "Failed to submit vote");
      }

      // Update with server response (in case server has additional data)
      const updatedPoll = body.data as Poll;
      setPolls((prev) =>
        prev.map((p) =>
          p._id === updatedPoll._id ? { ...p, ...updatedPoll } : p
        )
      );

      toast({
        title: wasChangingVote ? "Vote updated" : "Vote submitted",
        description: wasChangingVote
          ? "Your vote has been successfully changed."
          : "Your vote has been recorded for this booth poll.",
      });
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
    switch (userRole) {
      case "student":
        return <StudentHeader />;
      case "staff":
      case "ta":
        return <StaffHeader />;
      case "professor":
        return <ProfessorHeader />;
      default:
        return <Header showHomeTop homeHref="/home" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Booth Voting</h1>
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
            {polls.map((poll) => {
              const hasVoted = !!poll.userVoteOptionId;
              const votedOption = poll.options.find(
                (opt) => opt._id === poll.userVoteOptionId
              );
              const isChangingVote =
                hasVoted &&
                selectedOptions[poll._id] &&
                selectedOptions[poll._id] !== poll.userVoteOptionId;

              return (
                <Card key={poll._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{poll.question}</CardTitle>
                      {hasVoted && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Voted
                        </Badge>
                      )}
                    </div>
                    {hasVoted && votedOption && (
                      <p className="text-sm text-muted-foreground mt-2">
                        You voted for:{" "}
                        <span className="font-semibold text-foreground">
                          {votedOption.optionText}
                        </span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={selectedOptions[poll._id] || ""}
                      onValueChange={(val) => handleSelect(poll._id, val)}
                    >
                      {poll.options.map((opt) => {
                        const isVotedOption = opt._id === poll.userVoteOptionId;
                        const isSelected =
                          selectedOptions[poll._id] === opt._id;

                        return (
                          <div
                            key={opt._id}
                            className={`flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 ${
                              isVotedOption
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : isSelected
                                  ? "border-primary bg-accent"
                                  : ""
                            }`}
                          >
                            <RadioGroupItem
                              value={opt._id}
                              id={`${poll._id}-${opt._id}`}
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <Label
                                htmlFor={`${poll._id}-${opt._id}`}
                                className="cursor-pointer flex-1"
                              >
                                {opt.optionText}
                              </Label>
                              {isVotedOption && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 border-green-500 text-green-700 dark:text-green-400 cursor-default pointer-events-none"
                                >
                                  Your vote
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>
                    {(!hasVoted || isChangingVote) && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleVote(poll._id)}
                          disabled={
                            submittingPollId === poll._id ||
                            !selectedOptions[poll._id]
                          }
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingPollId === poll._id
                            ? "Submitting..."
                            : isChangingVote
                              ? "Change Vote"
                              : "Submit Vote"}
                        </Button>
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
