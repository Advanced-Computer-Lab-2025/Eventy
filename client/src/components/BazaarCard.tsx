import { Calendar, MapPin, Users, Bookmark, Share2, Store, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import VendorApplicationDialog from "./VendorApplicationDialog";

export interface BazaarCardProps {
  id: string;
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
  onRegister?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
}

export default function BazaarCard({
  id,
  name,
  description,
  location,
  startDate,
  endDate,
  registrationDeadline,
  status,
  attendees = 0,
  capacity,
  bannerImage,
  onRegister,
  onSave,
  onShare,
  onEdit,
}: BazaarCardProps) {
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Check if registration is still open
  const isRegistrationOpen = new Date(registrationDeadline) > new Date();

  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    } else {
      setIsApplicationDialogOpen(true);
    }
  };

  return (
    <Card 
      className="group overflow-hidden hover-elevate transition-all duration-200 hover:-translate-y-1"
      data-testid={`card-bazaar-${id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Store className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(status)} border`}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-700">
            <Store className="h-3 w-3 mr-1" />
            BAZAAR
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
          <div className="font-mono text-sm">
            <div className="font-semibold text-foreground">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
            <div className="text-muted-foreground">
              {formatTime(startDate)} - {formatTime(endDate)}
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold line-clamp-2 text-foreground" data-testid={`text-bazaar-title-${id}`}>
          {name}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{attendees}{capacity ? `/${capacity}` : ''}</span>
          </div>
        </div>

        {!isRegistrationOpen && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            Registration closed on {formatDate(registrationDeadline)}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={onEdit}
              data-testid={`button-edit-${id}`}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button 
            onClick={handleRegister} 
            className="flex-1"
            disabled={!isRegistrationOpen}
            data-testid={`button-register-${id}`}
          >
            {isRegistrationOpen ? 'Register' : 'Registration Closed'}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={onSave}
            data-testid={`button-save-${id}`}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={onShare}
            data-testid={`button-share-${id}`}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      
      <VendorApplicationDialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        bazaarId={id}
        bazaarName={name}
      />
    </Card>
  );
}
