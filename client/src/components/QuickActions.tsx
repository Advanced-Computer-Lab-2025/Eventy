import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionsProps {
  onCreateEvent?: () => void;
  onEditBazaar?: () => void;
}

export default function QuickActions({
  onCreateEvent,
  onEditBazaar,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          className="w-full justify-start gap-2" 
          onClick={onCreateEvent}
          data-testid="button-create-event"
        >
          <Plus className="h-4 w-4" />
          Create Bazaar
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onEditBazaar}
          data-testid="button-edit-bazaar"
        >
          <Pencil className="h-4 w-4" />
          Edit bazaar
        </Button>
      </CardContent>
    </Card>
  );
}
