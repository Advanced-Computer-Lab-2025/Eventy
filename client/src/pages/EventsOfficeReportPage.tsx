import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import EventsReport from "@/components/EventsReport";

export default function EventsReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Attendees Report</h1>
          <p className="text-muted-foreground">
            Overview of attendees across all events
          </p>
        </div>
        <EventsReport />
      </main>
    </div>
  );
}
