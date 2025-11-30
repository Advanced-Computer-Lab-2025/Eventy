import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Clock,
  Briefcase,
  Wallet,
  FileText,
  User,
  AlignLeft,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import { motion, AnimatePresence } from "framer-motion";

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  loading: boolean;
}

export default function EventDetailsDialog({
  open,
  onOpenChange,
  event,
}: EventDetailsDialogProps) {
  if (!event) return null;

  // Helper to format date and time separately
  const formatDateTime = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      fullDate: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const start = formatDateTime(event.startDate);
  const end = formatDateTime(event.endDate);

  const contentAnimation = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-[#1D1825] border-purple-100 dark:border-[#6A33B8]/30 shadow-2xl shadow-purple-900/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={event.id}
            initial="hidden"
            animate="visible"
            variants={contentAnimation}
            className="flex flex-col max-h-[85vh]"
          >
            {/* --- Header Section --- */}
            <div className="relative p-6 pb-2 shrink-0">
              {/* Purple Glow Gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#6A33B8]/10 to-transparent pointer-events-none" />

              {/* 
                  Added pr-12 (padding-right) here to ensure content doesn't 
                  go under the Close 'X' button 
              */}
              <div className="relative z-10 space-y-1 pr-12">
                {/* Title and Badge Row - Now aligned to start to avoid corner collision */}
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {event.name}
                  </DialogTitle>
                  <div className="mt-1">
                    <CategoryBadge category={event.eventType} />
                  </div>
                </div>

                {/* Location Badge */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/70 pt-2">
                  <MapPin className="w-4 h-4 text-[#6A33B8] dark:text-[#9F7AEA]" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            {/* --- Scrollable Body with Themed Scrollbar --- */}
            <div
              className="
              overflow-y-auto p-6 pt-2 space-y-6 pr-4
              
              /* Scrollbar Styling */
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              
              /* Light Mode Scrollbar */
              [&::-webkit-scrollbar-thumb]:bg-gray-200
              [&::-webkit-scrollbar-thumb]:rounded-full
              
              /* Dark Mode Scrollbar */
              dark:[&::-webkit-scrollbar-thumb]:bg-[#6A33B8]/10
              dark:[&::-webkit-scrollbar-thumb]:hover:bg-[#6A33B8]/40
              
              transition-colors
            "
            >
              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {start && (
                  <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                    <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                      Start
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {start.fullDate}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                      <Clock className="w-4 h-4 opacity-70" />
                      {start.time}
                    </div>
                  </div>
                )}

                {end && (
                  <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                    <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                      End
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {end.fullDate}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                      <Clock className="w-4 h-4 opacity-70" />
                      {end.time}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100">
                  <AlignLeft className="w-4 h-4 text-[#6A33B8] dark:text-[#A78BFA]" />{" "}
                  Description
                </h4>
                <div className="text-sm leading-relaxed text-slate-600 dark:text-purple-200/80">
                  {event.description || "No description provided."}
                </div>
              </div>

              {/* Dynamic Grid for Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.capacity && (
                  <DetailCard
                    icon={Users}
                    label="Capacity"
                    value={`${event.capacity} People`}
                  />
                )}
                {event.faculty && (
                  <DetailCard
                    icon={Briefcase}
                    label="Faculty"
                    value={event.faculty}
                  />
                )}
                {event.fundingSource && (
                  <DetailCard
                    icon={Wallet}
                    label="Funding"
                    value={event.fundingSource}
                  />
                )}
                {event.extraResources && (
                  <DetailCard
                    icon={FileText}
                    label="Extra Resources"
                    value={event.extraResources}
                  />
                )}
              </div>

              {/* Agenda Section */}
              {event.agenda && (
                <div className="bg-slate-50 dark:bg-[#130F19] rounded-xl p-4 border border-slate-200 dark:border-[#6A33B8]/20">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100 mb-2">
                    <Clock className="w-4 h-4 text-[#6A33B8] dark:text-[#A78BFA]" />{" "}
                    Agenda
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-purple-200/80 whitespace-pre-wrap">
                    {event.agenda}
                  </p>
                </div>
              )}

              {/* Professors Section */}
              {event.professors && event.professors.length > 0 && (
                <div className="pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100 mb-3">
                    <GraduationCap className="w-4 h-4 text-[#6A33B8] dark:text-[#A78BFA]" />
                    Invited Professors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.professors.map((prof: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#130F19] border border-slate-200 dark:border-[#6A33B8]/30 text-sm transition-colors hover:bg-slate-200 dark:hover:border-[#6A33B8]/60"
                      >
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-[#6A33B8]/20 text-purple-600 dark:text-[#D6BCFA] flex items-center justify-center">
                          <User size={12} />
                        </div>
                        <span className="text-slate-700 dark:text-purple-100">
                          {prof.firstName && prof.lastName
                            ? `${prof.firstName} ${prof.lastName}`
                            : prof.name || "Professor"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Helper component
function DetailCard({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#6A33B8]/20 bg-slate-50/50 dark:bg-[#130F19]">
      <div className="p-2 rounded-lg bg-purple-100 dark:bg-[#6A33B8]/20 text-[#6A33B8] dark:text-[#D6BCFA] shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-purple-300/60 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-purple-50 break-words whitespace-pre-wrap">
          {value}
        </p>
      </div>
    </div>
  );
}
