import QuickActions from "../QuickActions";

export default function QuickActionsExample() {
  return (
    <div className="p-6 max-w-sm">
      <QuickActions
        onCreateEvent={() => logger.info("Create event")}
        onImport={() => logger.info("Import")}
        onExport={() => logger.info("Export")}
        onSettings={() => logger.info("Settings")}
      />
    </div>
  );
}
