import EventHero from "../EventHero";

export default function EventHeroExample() {
  return (
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
  );
}
