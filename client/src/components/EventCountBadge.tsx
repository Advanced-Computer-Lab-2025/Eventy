import React from "react";

interface EventCountBadgeProps {
  count: number;
  loading: boolean;
}

export default function EventCountBadge({
  count,
  loading,
}: EventCountBadgeProps) {
  if (loading) return null;

  return (
    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground border">
      {count} found
    </span>
  );
}
