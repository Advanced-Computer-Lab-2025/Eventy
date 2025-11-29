import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function EmptyState({
  title = "No events found",
  description = "Try adjusting your filters or search criteria",
  icon: Icon = Calendar,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center">{description}</p>
      </CardContent>
    </Card>
  );
}
