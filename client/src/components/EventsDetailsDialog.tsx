import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
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
  DollarSign,
  Globe,
  AlertCircle,
  Landmark,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import { motion, AnimatePresence } from "framer-motion";
import { getEventImage } from "@/lib/eventImages";

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  loading?: boolean;
}

export default function EventDetailsDialog({
  open,
  onOpenChange,
  event,
}: EventDetailsDialogProps) {
  const [similarEvents, setSimilarEvents] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Fetch similar events when dialog opens
  useEffect(() => {
    const fetchSimilarEvents = async () => {
      if (!event || !event._id || !open) {
        setSimilarEvents([]);
        return;
      }

      try {
        setLoadingSimilar(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/api/recommendations/similar/${event._id}?limit=4`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch similar events");
          return;
        }

        const recommendations = await response.json();

        // Fetch full event details
        if (recommendations && recommendations.length > 0) {
          const eventIds = recommendations.map((rec: any) => rec.event_id);
          const eventDetailsPromises = eventIds.map((id: string) =>
            fetch(`http://localhost:5000/api/events/${id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }).then((res) => res.json())
          );

          const eventDetails = await Promise.all(eventDetailsPromises);
          setSimilarEvents(eventDetails.filter((e) => e && e._id));
        }
      } catch (err) {
        console.error("Failed to fetch similar events:", err);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilarEvents();
  }, [event?._id, open]);

  if (!event) return null;

  // --- Date Formatting Logic based on Schema ---
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Use the explicit time string from DB, or fallback to extracting from Date object
  const startTime =
    event.startTime ||
    (event.startDate
      ? new Date(event.startDate).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null);
  const endTime =
    event.endTime ||
    (event.endDate
      ? new Date(event.endDate).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null);

  const startDateStr = formatDate(event.startDate);
  const endDateStr = formatDate(event.endDate);
  const deadlineStr = formatDate(event.registrationDeadline);

  // --- Animation ---
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
            key={event._id || event.id} // Handle Mongoose _id
            initial="hidden"
            animate="visible"
            variants={contentAnimation}
            className="flex flex-col max-h-[85vh]"
          >
            {/* ================= HEADER ================= */}
            <div className="relative p-6 pb-2 shrink-0">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#6A33B8]/10 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-1 pr-12">
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {event.name}
                  </DialogTitle>
                  <div className="mt-1">
                    <CategoryBadge category={event.eventType} />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/70 pt-2">
                  <MapPin className="w-4 h-4 text-[#6A33B8] dark:text-[#9F7AEA]" />
                  <span>{event.location || "Location TBD"}</span>
                </div>
              </div>
            </div>

            {/* ================= BODY ================= */}
            <div
              className="
              overflow-y-auto p-6 pt-2 space-y-6 pr-4
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-200
              [&::-webkit-scrollbar-thumb]:rounded-full
              dark:[&::-webkit-scrollbar-thumb]:bg-[#6A33B8]/10
              dark:[&::-webkit-scrollbar-thumb]:hover:bg-[#6A33B8]/40
              transition-colors
            "
            >
              {/* 1. Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {startDateStr && (
                  <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                    <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                      Start
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {startDateStr}
                    </div>
                    {startTime && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                        <Clock className="w-4 h-4 opacity-70" />
                        {startTime}
                      </div>
                    )}
                  </div>
                )}

                {endDateStr && (
                  <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                    <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                      End
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {endDateStr}
                    </div>
                    {endTime && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                        <Clock className="w-4 h-4 opacity-70" />
                        {endTime}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Description */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100">
                  <AlignLeft className="w-4 h-4 text-[#6A33B8] dark:text-[#A78BFA]" />{" "}
                  Description
                </h4>
                <div className="text-sm leading-relaxed text-slate-600 dark:text-purple-200/80">
                  {event.description || "No description provided."}
                </div>
              </div>

              {/* 3. Detailed Info Grid (Dynamic based on Schema) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Registration Deadline */}
                {deadlineStr && (
                  <DetailCard
                    icon={AlertCircle}
                    label="Reg. Deadline"
                    value={deadlineStr}
                    className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10"
                    iconClass="text-red-600 dark:text-red-400"
                  />
                )}

                {/* Price (Trips & Workshops) - In Dollars */}
                {event.price !== undefined && event.price !== null && (
                  <DetailCard
                    icon={DollarSign}
                    label="Price"
                    value={`$${event.price}`}
                  />
                )}

                {/* Capacity */}
                {event.capacity && (
                  <DetailCard
                    icon={Users}
                    label="Capacity"
                    value={`${event.capacity} Attendees`}
                  />
                )}

                {/* Faculty (Workshops) */}
                {event.faculty && (
                  <DetailCard
                    icon={GraduationCap}
                    label="Faculty"
                    value={event.faculty}
                  />
                )}

                {/* Conference Website URL */}
                {event.websiteUrl && (
                  <a
                    href={event.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <DetailCard
                      icon={Globe}
                      label="Conference Site"
                      value="Visit Website"
                      isLink
                    />
                  </a>
                )}

                {/* Funding Source (Workshops & Conferences) */}
                {event.fundingSource && (
                  <DetailCard
                    icon={Landmark}
                    label="Funding Source"
                    value={
                      event.fundingSource === "guc"
                        ? "Internal (GUC)"
                        : "External"
                    }
                  />
                )}

                {/* Required Budget (Workshops & Conferences) - In Dollars */}
                {event.requiredBudget && (
                  <DetailCard
                    icon={Wallet}
                    label="Required Budget"
                    value={`$${event.requiredBudget.toLocaleString()}`}
                  />
                )}

                {/* Platform Booth Details */}
                {event.eventType === "platform_booth" && event.boothSize && (
                  <DetailCard
                    icon={LayoutGrid}
                    label="Booth Size"
                    value={event.boothSize}
                  />
                )}

                {/* Extra Resources */}
                {event.extraResources && (
                  <DetailCard
                    icon={FileText}
                    label="Required Resources"
                    value={event.extraResources}
                    className="sm:col-span-2"
                  />
                )}
              </div>

              {/* 4. Agenda (Workshops & Conferences) */}
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

              {/* 5. Professors (Workshops & Conferences) */}
              {event.professors && event.professors.length > 0 && (
                <div className="pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100 mb-3">
                    <Briefcase className="w-4 h-4 text-[#6A33B8] dark:text-[#A78BFA]" />
                    Participating Professors
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
                          {/* Handle Populated User Object vs ID string */}
                          {typeof prof === "object"
                            ? prof.firstName && prof.lastName
                              ? `${prof.firstName} ${prof.lastName}`
                              : prof.name || prof.username
                            : "Professor Details Unavailable"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= SIMILAR EVENTS ================= */}
            {similarEvents.length > 0 && (
              <div className="px-6 pb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#6A33B8]" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Similar Events
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {similarEvents.map((similarEvent) => {
                    const similarStartDate = similarEvent.startDate
                      ? new Date(similarEvent.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "TBA";

                    return (
                      <div
                        key={similarEvent._id}
                        onClick={() => {
                          onOpenChange(false);
                          setTimeout(() => {
                            window.location.href = `/?event=${similarEvent._id}`;
                          }, 100);
                        }}
                        className="group cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-[#6A33B8]/20 bg-white dark:bg-[#130F19] hover:border-[#6A33B8] hover:shadow-md transition-all"
                      >
                        <div className="flex gap-3">
                          <img
                            src={
                              similarEvent.bannerImage ||
                              similarEvent.image ||
                              getEventImage(similarEvent.eventType || "")
                            }
                            alt={similarEvent.name}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#6A33B8] transition-colors">
                              {similarEvent.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-purple-300/70">
                              <Calendar size={12} />
                              <span>{similarStartDate}</span>
                            </div>
                            <div className="mt-1">
                              <CategoryBadge
                                category={similarEvent.eventType}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// --- Dynamic Detail Card Component ---
function DetailCard({
  icon: Icon,
  label,
  value,
  className = "",
  iconClass = "",
  isLink = false,
}: any) {
  const baseClasses =
    "flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#6A33B8]/20 bg-slate-50/50 dark:bg-[#130F19] transition-all";
  const linkClasses = isLink
    ? "group-hover:border-[#6A33B8] group-hover:bg-purple-50 dark:group-hover:bg-[#6A33B8]/10 cursor-pointer"
    : "";
  const defaultIconClass =
    "p-2 rounded-lg bg-purple-100 dark:bg-[#6A33B8]/20 text-[#6A33B8] dark:text-[#D6BCFA] shrink-0";

  return (
    <div className={`${baseClasses} ${className} ${linkClasses}`}>
      <div className={iconClass || defaultIconClass}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-purple-300/60 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-medium text-slate-900 dark:text-purple-50 break-words whitespace-pre-wrap ${isLink ? "underline decoration-dotted underline-offset-4" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
