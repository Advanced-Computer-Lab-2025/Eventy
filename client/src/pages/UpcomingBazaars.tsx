import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import BazaarList, { Bazaar } from "@/components/BazaarList";
import { Button } from "@/components/ui/button";
import { Store, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bazaarApiService } from "@/lib/bazaarApi";

export default function UpcomingBazaars() {
  const [bazaars, setBazaars] = useState<Bazaar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch bazaars from API
  const fetchBazaars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedBazaars = await bazaarApiService.getUpcomingBazaars();
      setBazaars(fetchedBazaars);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch bazaars";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load bazaars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBazaars();
  }, []);

  const handleRegister = async (bazaarId: string) => {
    try {
      await bazaarApiService.registerForBazaar(bazaarId);
      toast({
        title: "Success",
        description: "Successfully registered for the bazaar!",
      });
      // Refresh the list to update attendee count
      fetchBazaars();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSave = (bazaarId: string) => {
    toast({
      title: "Saved",
      description: "Bazaar saved to your favorites!",
    });
  };

  const handleShare = (bazaarId: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this bazaar!",
        text: "I found an interesting bazaar at GUC",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Bazaar link copied to clipboard!",
      });
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Upcoming Bazaars</h1>
            </div>
            <Button
              variant="outline"
              onClick={fetchBazaars}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover and explore upcoming bazaars at GUC
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBazaars}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading bazaars...</p>
          </div>
        )}

        {/* Bazaar List */}
        {!loading && (
          <BazaarList
            bazaars={bazaars}
            onRegister={handleRegister}
            onSave={handleSave}
            onShare={handleShare}
            showFilters={true}
          />
        )}
      </div>
    </PageLayout>
  );
}
