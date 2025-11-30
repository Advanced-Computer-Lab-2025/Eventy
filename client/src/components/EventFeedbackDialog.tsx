import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
}

interface Comment {
  _id: string;
  userId: {
    // backend may populate different name fields depending on user model
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  rating?: number;
  comment?: string;
  createdAt: string;
}

interface FeedbackResponse {
  feedback: Comment[];
  averageRating: number;
  totalReviews: number;
}

export default function EventFeedbackDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
}: EventFeedbackDialogProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userFeedback, setUserFeedback] = useState<Comment | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [commentError, setCommentError] = useState("");

  const fetchUserFeedback = async () => {
    try {
      setCheckingSubmission(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/feedback/events/${eventId}/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setHasSubmitted(true);
          setUserFeedback(data.data);
        }
      } else if (response.status === 403 || response.status === 401) {
        // User not authorized - this shouldn't happen if they're on My Events page
        toast({
          title: "Error",
          description: "You are not authorized to view this feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      // Silent fail - allow user to submit if check fails
    } finally {
      setCheckingSubmission(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/feedback/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch feedback");
      const data = await response.json();
      // debug: log returned feedback to inspect populated user fields
      // eslint-disable-next-line no-console
      console.log("fetched feedback:", data.data.feedback);
      setComments(data.data.feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && eventId) {
      fetchUserFeedback();
      fetchFeedback();
    } else if (!open) {
      // Reset state when dialog closes
      setRating(0);
      setComment("");
      setHasSubmitted(false);
      setUserFeedback(null);
      setComments([]);
      setCheckingSubmission(false);
      setRatingError("");
      setCommentError("");
    }
  }, [open, eventId]);

  const validateForm = () => {
    let isValid = true;

    // Validate rating if provided
    if (rating !== 0) {
      if (rating < 1 || rating > 5) {
        setRatingError("Please select a rating between 1 and 5");
        isValid = false;
      } else {
        setRatingError("");
      }
    } else {
      setRatingError("");
    }

    // Validate comment length
    if (comment.length > 1000) {
      setCommentError("Comment must not exceed 1000 characters");
      isValid = false;
    } else {
      setCommentError("");
    }

    // Require at least rating or non-empty comment
    if (rating === 0 && comment.trim().length === 0) {
      isValid = false;
      if (!ratingError && !commentError) {
        toast({
          title: "Validation",
          description: "Provide at least a rating or a non-empty comment",
          variant: "destructive",
        });
      }
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const body: any = {
        eventId,
      };
      // Only include rating if user hasn't already rated and selected a rating
      if (!hasSubmitted && rating > 0) body.rating = rating;
      if (comment.trim().length > 0) body.comment = comment;

      const response = await fetch(
        `http://localhost:4000/api/feedback/events/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit feedback");
      }

      // Clear form and refresh feedback
      setRating(0);
      setComment("");
      setHasSubmitted((prev) => prev || typeof body.rating === "number");
      fetchUserFeedback();
      fetchFeedback();

      toast({
        title: "Success",
        description: "Your feedback has been submitted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Event Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts about {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          {checkingSubmission ? (
            <div className="bg-muted rounded-lg p-6 text-center space-y-4 animate-pulse">
              <div className="h-6 bg-muted-foreground/20 rounded w-3/4 mx-auto"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : (
            <>
              {hasSubmitted && userFeedback && (
                <div className="bg-muted rounded-lg p-6 text-center space-y-4">
                  <div className="text-lg font-medium">
                    You've already rated this event
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`w-5 h-5 ${
                            index < (userFeedback.rating || 0)
                              ? "fill-current"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {userFeedback.comment && (
                      <p className="text-sm text-muted-foreground italic">
                        "{userFeedback.comment}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted on {formatDate(userFeedback.createdAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Rating Section (only show if not already rated) */}
              {!hasSubmitted && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setRating(index);
                          setRatingError("");
                        }}
                        onMouseEnter={() => setHoverRating(index)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            index <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {ratingError && (
                    <p className="text-sm text-destructive">{ratingError}</p>
                  )}
                </div>
              )}

              {/* Comment Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Your Comment
                  </label>
                  <span
                    className={`text-xs ${
                      comment.length > 1000
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {comment.length}/1000
                  </span>
                </div>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (e.target.value.length <= 1000) {
                      setCommentError("");
                    }
                  }}
                  placeholder="Share your experience..."
                  className={`min-h-[100px] ${
                    commentError ? "border-destructive" : ""
                  }`}
                />
                {commentError && (
                  <p className="text-sm text-destructive">{commentError}</p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={
                  submitting ||
                  comment.length > 1000 ||
                  (rating === 0 && comment.trim().length === 0)
                }
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </>
          )}

          {/* Previous Comments */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Previous Feedback</h4>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading feedback...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No feedback yet
                  </div>
                ) : (
                  comments.map((comment) => {
                    const user = comment.userId || ({} as any);
                    const displayName =
                      (user.name && String(user.name).trim()) ||
                      ((user.firstName || user.lastName) &&
                        `${user.firstName || ""} ${
                          user.lastName || ""
                        }`.trim()) ||
                      user.email ||
                      "Anonymous";

                    return (
                      <div key={comment._id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        {typeof comment.rating === "number" && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-4 h-4 ${
                                  index < (comment.rating || 0)
                                    ? "fill-current"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {comment.comment && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {comment.comment}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
