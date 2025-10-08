import { useState } from "react";
import EventCard from "@/components/EventCard";
import EventHero from "@/components/EventHero";
import EventFilters from "@/components/EventFilters";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";

//todo: remove mock functionality
const mockEvents = [
  {
    id: "1",
    title: "AI & Machine Learning Workshop",
    category: "academic" as const,
    date: "March 15, 2024",
    time: "2:00 PM - 5:00 PM",
    location: "Engineering Building, Room 301",
    attendees: 45,
    image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Spring Festival Celebration",
    category: "cultural" as const,
    date: "March 20, 2024",
    time: "6:00 PM - 10:00 PM",
    location: "Main Quadrangle",
    attendees: 320,
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Basketball Championship Finals",
    category: "sports" as const,
    date: "March 18, 2024",
    time: "7:00 PM - 9:00 PM",
    location: "Sports Center Arena",
    attendees: 500,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Career Fair 2024",
    category: "career" as const,
    date: "March 25, 2024",
    time: "10:00 AM - 4:00 PM",
    location: "Convention Center",
    attendees: 180,
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Annual Music Concert",
    category: "social" as const,
    date: "March 28, 2024",
    time: "8:00 PM - 11:00 PM",
    location: "University Auditorium",
    attendees: 250,
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Research Symposium",
    category: "academic" as const,
    date: "March 22, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "Science Building Hall",
    attendees: 95,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop",
  },
];

export default function Home() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={(query) => console.log("Search:", query)} />
      
      <main className="pb-20 md:pb-8">
        <EventHero
          title="Annual Tech Summit 2024"
          category="career"
          date="April 20, 2024"
          time="9:00 AM - 6:00 PM"
          location="University Convention Center"
          attendees={250}
          image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop"
          description="Join us for the biggest tech event of the year featuring industry leaders, workshops, and networking opportunities."
          onRegister={() => console.log("Register clicked")}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                <EventFilters />
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">
                  Discover exciting events happening at your university
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    {...event}
                    onRegister={() => console.log("Register:", event.title)}
                    onSave={() => console.log("Save:", event.title)}
                    onShare={() => console.log("Share:", event.title)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
