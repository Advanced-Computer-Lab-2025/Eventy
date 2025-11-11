import { Calendar, Users, TrendingUp } from "lucide-react";
import StatCard from "../StatCard";

export default function StatCardExample() {
  return (
    <div className="p-6 grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Events"
        value="142"
        icon={Calendar}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Total Attendees"
        value="3,456"
        icon={Users}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard title="Active Now" value="24" icon={TrendingUp} />
    </div>
  );
}
