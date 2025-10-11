import { Plus, Upload, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionsProps {
  onCreateEvent?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

export default function QuickActions({
  onCreateEvent,
  onImport,
  onExport,
  onSettings,
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
          Create Event
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onImport}
          data-testid="button-import"
        >
          <Upload className="h-4 w-4" />
          Import Events
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onExport}
          data-testid="button-export"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onSettings}
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </CardContent>
    </Card>
  );
}
