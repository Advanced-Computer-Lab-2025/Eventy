import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import { useToast } from "../hooks/use-toast";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const FavoriteButton = ({
  eventId,
  className = "",
  size = "md",
}: FavoriteButtonProps) => {
  const { toast } = useToast();
  const { isFavorite, toggleFavorite, isEventLoading } = useFavorites();
  const isFavorited = isFavorite(eventId);
  const isLoading = isEventLoading(eventId);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    try {
      const result = await toggleFavorite(eventId, isFavorited);

      if (result?.success) {
        toast({
          title: isFavorited ? "Removed from favorites" : "Added to favorites",
          description: isFavorited
            ? "This event has been removed from your favorites."
            : "This event has been added to your favorites.",
        });
      } else {
        throw new Error(result?.error || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update favorites";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative p-2 rounded-full transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isFavorited
            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            : "text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        }
        ${className}
      `}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      ) : (
        <Heart
          className={`
            ${sizeClasses[size]} 
            transition-all duration-200
            ${isFavorited ? "fill-current scale-110" : "scale-100"}
          `}
        />
      )}
    </button>
  );
};
