import { useState, useEffect } from "react";
import BazaarCard, { BazaarCardProps } from "./BazaarCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Store } from "lucide-react";

export interface Bazaar {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  attendees?: number;
  capacity?: number;
  bannerImage?: string;
  eventType: "bazaar";
  createdBy: string;
}

interface BazaarListProps {
  bazaars?: Bazaar[];
  onRegister?: (bazaarId: string) => void;
  onSave?: (bazaarId: string) => void;
  onShare?: (bazaarId: string) => void;
  showFilters?: boolean;
  className?: string;
}

export default function BazaarList({
  bazaars = [],
  onRegister,
  onSave,
  onShare,
  showFilters = true,
  className = "",
}: BazaarListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBazaars, setFilteredBazaars] = useState<Bazaar[]>(bazaars);

  // Filter bazaars based on search term
  useEffect(() => {
    let filtered = bazaars;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (bazaar) =>
          bazaar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bazaar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bazaar.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBazaars(filtered);
  }, [bazaars, searchTerm]);

  const handleRegister = (bazaarId: string) => {
    if (onRegister) {
      onRegister(bazaarId);
    } else {
      console.log(`Register for bazaar: ${bazaarId}`);
    }
  };

  const handleSave = (bazaarId: string) => {
    if (onSave) {
      onSave(bazaarId);
    } else {
      console.log(`Save bazaar: ${bazaarId}`);
    }
  };

  const handleShare = (bazaarId: string) => {
    if (onShare) {
      onShare(bazaarId);
    } else {
      console.log(`Share bazaar: ${bazaarId}`);
    }
  };

  if (bazaars.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bazaars available</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for upcoming bazaars
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Filter */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bazaars..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredBazaars.length} bazaar{filteredBazaars.length !== 1 ? 's' : ''} found
        </p>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
            }}
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Bazaar Grid */}
      {filteredBazaars.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bazaars match your search</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBazaars.map((bazaar) => (
            <BazaarCard
              key={bazaar._id}
              id={bazaar._id}
              name={bazaar.name}
              description={bazaar.description}
              location={bazaar.location}
              startDate={bazaar.startDate}
              endDate={bazaar.endDate}
              registrationDeadline={bazaar.registrationDeadline}
              status={bazaar.status}
              attendees={bazaar.attendees}
              capacity={bazaar.capacity}
              bannerImage={bazaar.bannerImage}
              onRegister={() => handleRegister(bazaar._id)}
              onSave={() => handleSave(bazaar._id)}
              onShare={() => handleShare(bazaar._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
