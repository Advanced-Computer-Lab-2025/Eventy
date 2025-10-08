import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, SlidersHorizontal } from "lucide-react";

const categories = [
  { id: "academic", label: "Academic" },
  { id: "social", label: "Social" },
  { id: "sports", label: "Sports" },
  { id: "cultural", label: "Cultural" },
  { id: "career", label: "Career" },
];

const locations = [
  { id: "main-hall", label: "Main Hall" },
  { id: "engineering", label: "Engineering Building" },
  { id: "sports-center", label: "Sports Center" },
  { id: "library", label: "Library" },
  { id: "auditorium", label: "Auditorium" },
];

interface EventFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export default function EventFilters({ onFilterChange }: EventFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4" />
            Categories
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <Checkbox 
                  id={category.id}
                  data-testid={`checkbox-category-${category.id}`}
                  onCheckedChange={(checked) => 
                    console.log(`${category.label}: ${checked}`)
                  }
                />
                <Label htmlFor={category.id} className="cursor-pointer">
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center gap-2">
                <Checkbox 
                  id={location.id}
                  data-testid={`checkbox-location-${location.id}`}
                  onCheckedChange={(checked) => 
                    console.log(`${location.label}: ${checked}`)
                  }
                />
                <Label htmlFor={location.id} className="cursor-pointer">
                  {location.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}
