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
  | "booth"
  | "platform_booth"
  | "trip"
  | "conference";

export type CategoryBadgeTone = "default" | "prominent";

const categoryColors: Record<EventCategory, string> = {
  academic:
    "bg-blue-500/90 text-white hover:bg-blue-500 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30 dark:border-blue-400/30",
  social:
    "bg-pink-500/90 text-white hover:bg-pink-500 dark:bg-pink-500/20 dark:text-pink-200 dark:hover:bg-pink-500/30 dark:border-pink-400/30",
  sports:
    "bg-orange-500/90 text-white hover:bg-orange-500 dark:bg-orange-500/20 dark:text-orange-200 dark:hover:bg-orange-500/30 dark:border-orange-400/30",
  cultural:
    "bg-purple-500/90 text-white hover:bg-purple-500 dark:bg-purple-500/20 dark:text-purple-200 dark:hover:bg-purple-500/30 dark:border-purple-400/30",
  career:
    "bg-green-500/90 text-white hover:bg-green-500 dark:bg-green-500/20 dark:text-green-200 dark:hover:bg-green-500/30 dark:border-green-400/30",
  workshop:
    "bg-indigo-500/90 text-white hover:bg-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30 dark:border-indigo-400/30",
  bazaar:
    "bg-violet-500/90 text-white hover:bg-violet-500 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30 dark:border-violet-400/30",
  booth:
    "bg-amber-500/90 text-white hover:bg-amber-500 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30 dark:border-amber-400/30",
  platform_booth:
    "bg-amber-500/90 text-white hover:bg-amber-500 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30 dark:border-amber-400/30",
  trip: "bg-teal-500/90 text-white hover:bg-teal-500 dark:bg-teal-500/20 dark:text-teal-200 dark:hover:bg-teal-500/30 dark:border-teal-400/30",
  conference:
    "bg-sky-500/90 text-white hover:bg-sky-500 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/30 dark:border-sky-400/30",
};

const categoryColorsProminent: Record<EventCategory, string> = {
  academic:
    "bg-blue-500/90 text-white hover:bg-blue-500 dark:bg-blue-500/75 dark:text-blue-50 dark:hover:bg-blue-500/85 dark:border-blue-200/40",
  social:
    "bg-pink-500/90 text-white hover:bg-pink-500 dark:bg-pink-500/75 dark:text-pink-50 dark:hover:bg-pink-500/85 dark:border-pink-200/40",
  sports:
    "bg-orange-500/90 text-white hover:bg-orange-500 dark:bg-orange-500/75 dark:text-orange-50 dark:hover:bg-orange-500/85 dark:border-orange-200/40",
  cultural:
    "bg-purple-500/90 text-white hover:bg-purple-500 dark:bg-purple-500/75 dark:text-purple-50 dark:hover:bg-purple-500/85 dark:border-purple-200/40",
  career:
    "bg-green-500/90 text-white hover:bg-green-500 dark:bg-green-500/75 dark:text-green-50 dark:hover:bg-green-500/85 dark:border-green-200/40",
  workshop:
    "bg-indigo-500/90 text-white hover:bg-indigo-500 dark:bg-indigo-500/75 dark:text-indigo-50 dark:hover:bg-indigo-500/85 dark:border-indigo-200/40",
  bazaar:
    "bg-violet-500/90 text-white hover:bg-violet-500 dark:bg-violet-500/75 dark:text-violet-50 dark:hover:bg-violet-500/85 dark:border-violet-200/40",
  booth:
    "bg-amber-500/90 text-white hover:bg-amber-500 dark:bg-amber-500/75 dark:text-amber-50 dark:hover:bg-amber-500/85 dark:border-amber-200/40",
  platform_booth:
    "bg-amber-500/90 text-white hover:bg-amber-500 dark:bg-amber-500/75 dark:text-amber-50 dark:hover:bg-amber-500/85 dark:border-amber-200/40",
  trip: "bg-teal-500/90 text-white hover:bg-teal-500 dark:bg-teal-500/75 dark:text-teal-50 dark:hover:bg-teal-500/85 dark:border-teal-200/40",
  conference:
    "bg-sky-500/90 text-white hover:bg-sky-500 dark:bg-sky-500/75 dark:text-sky-50 dark:hover:bg-sky-500/85 dark:border-sky-200/40",
};

const normalizeCategoryKey = (value: unknown): EventCategory | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase().replace(/\s+/g, "_").replace(/-+/g, "_");

  if (normalized === "platform_booth" || normalized === "platformbooth") {
    return "platform_booth";
  }

  if (normalized in categoryColors) return normalized as EventCategory;

  return null;
};

const formatCategoryLabel = (value: unknown): string => {
  const key = normalizeCategoryKey(value);
  const labelSource = key ?? String(value ?? "");

  return labelSource
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

interface CategoryBadgeProps {
  category: EventCategory | string;
  className?: string;
  tone?: CategoryBadgeTone;
}

export default function CategoryBadge({
  category,
  className,
  tone = "default",
}: CategoryBadgeProps) {
  const normalized = normalizeCategoryKey(category);
  const label = formatCategoryLabel(category);
  const colors =
    normalized && tone === "prominent"
      ? categoryColorsProminent[normalized]
      : normalized
        ? categoryColors[normalized]
        : "";

  return (
    <Badge
      variant={normalized ? "default" : "secondary"}
      className={`${colors} border-[0.5px] text-xs font-semibold ${className ?? ""}`}
      data-testid={`badge-category-${normalized ?? "unknown"}`}
    >
      {label}
    </Badge>
  );
}
