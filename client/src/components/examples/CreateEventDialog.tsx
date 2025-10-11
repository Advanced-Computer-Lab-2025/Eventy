import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateEventDialog from "../CreateEventDialog";

export default function CreateEventDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Create Event Dialog</Button>
      <CreateEventDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log("Event data:", data)}
      />
    </div>
  );
}
