import { Badge } from "@/components/ui/badge";

export type EventCategory =
  | "academic"
  | "social"
  | "sports"
  | "cultural"
  | "career"
  // extend to support event types used across the app
  | "workshop"
  | "bazaar"
  | "trip"
  | "conference";

const categoryColors: Record<EventCategory, string> = {
  academic: "bg-blue-500/90 text-white hover:bg-blue-500",
  social: "bg-pink-500/90 text-white hover:bg-pink-500",
  sports: "bg-orange-500/90 text-white hover:bg-orange-500",
  cultural: "bg-purple-500/90 text-white hover:bg-purple-500",
  career: "bg-green-500/90 text-white hover:bg-green-500",
  workshop: "bg-indigo-500/90 text-white hover:bg-indigo-500",
  bazaar: "bg-violet-500/90 text-white hover:bg-violet-500",
  trip: "bg-teal-500/90 text-white hover:bg-teal-500",
  conference: "bg-sky-500/90 text-white hover:bg-sky-500",
};

interface CategoryBadgeProps {
  category: EventCategory;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge 
      className={`${categoryColors[category]} capitalize text-xs font-semibold`}
      data-testid={`badge-category-${category}`}
    >
      {category}
    </Badge>
  );
}
