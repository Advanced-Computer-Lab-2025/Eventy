import QuickActions from "../QuickActions";

export default function QuickActionsExample() {
  return (
    <div className="p-6 max-w-sm">
      <QuickActions
        onCreateEvent={() => console.log("Create event")}
        onImport={() => console.log("Import")}
        onExport={() => console.log("Export")}
        onSettings={() => console.log("Settings")}
      />
    </div>
  );
}
