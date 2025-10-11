import { Badge } from "@/components/ui/badge";

export type EventCategory = "academic" | "social" | "sports" | "cultural" | "career";

const categoryColors = {
  academic: "bg-blue-500/90 text-white hover:bg-blue-500",
  social: "bg-pink-500/90 text-white hover:bg-pink-500",
  sports: "bg-orange-500/90 text-white hover:bg-orange-500",
  cultural: "bg-purple-500/90 text-white hover:bg-purple-500",
  career: "bg-green-500/90 text-white hover:bg-green-500",
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
