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
  DollarSign,
  Globe,
  AlertCircle,
  Landmark,
  LayoutGrid,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

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
  // --- Role Access Logic ---
  // We assume the user object is stored in localStorage.
  // If you pass it via context/props, you can change this line.
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role; // e.g., 'admin', 'events_office', 'student'

  // Only Admin and Events Office can see financial details
  const canViewFinancials = ["admin", "events_office"].includes(userRole);

  useEffect(() => {
    if (open && event?._id) {
      const token = localStorage.getItem("token");
      if (token) {
        const API_BASE_URL = getApiBaseUrl();
        fetch(`${API_BASE_URL}/api/events/${event._id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(() => {
            // Dispatch custom event to trigger recommendations refresh
            window.dispatchEvent(
              new CustomEvent("event-viewed", {
                detail: { eventId: event._id },
              })
            );
          })
          .catch((err) => logger.error("Failed to record view", err));
      }
    }
  }, [open, event]);

  if (!event) return null;

  // --- Date Formatting Logic ---
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStringTime = (timeStr?: string) => {
    if (!timeStr) return null;
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hoursStr, minutesStr] = timeStr.split(":");
      let hours = parseInt(hoursStr, 10);
      const suffix = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutesStr} ${suffix}`;
    }
    return timeStr;
  };

  const startTime =
    formatStringTime(event.startTime) ||
    (event.startDate
      ? new Date(event.startDate).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null);
  const endTime =
    formatStringTime(event.endTime) ||
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
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background text-foreground border-border shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={event._id || event.id}
            initial="hidden"
            animate="visible"
            variants={contentAnimation}
            className="flex flex-col max-h-[85vh]"
          >
            {/* ================= HEADER ================= */}
            <div className="relative p-6 pb-2 shrink-0">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-1 pr-12">
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">
                    {event.name}
                  </DialogTitle>
                  <div className="mt-1">
                    <CategoryBadge category={event.eventType} />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <MapPin className="w-4 h-4 text-primary" />
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

              {/* 3. Detailed Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Registration Deadline (With Fixed Red Box Style) */}
                {deadlineStr && (
                  <DetailCard
                    icon={AlertCircle}
                    label="Reg. Deadline"
                    value={deadlineStr}
                    className="border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10"
                    iconClass="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 shrink-0"
                  />
                )}

                {/* Price */}
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

                {/* Faculty */}
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

                {/* Funding Source - CONDITIONAL RENDER */}
                {canViewFinancials && event.fundingSource && (
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

                {/* Required Budget - CONDITIONAL RENDER */}
                {canViewFinancials && event.requiredBudget && (
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

              {/* 4. Agenda */}
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

              {/* 5. Professors */}
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
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// --- Detail Card Component ---
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
  // If iconClass is provided, we use it. If not, use defaults.
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
