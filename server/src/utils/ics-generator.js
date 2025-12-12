import ical from "ical-generator";

/**
 * Generate ICS file content for calendar invite
 */
export const generateICSFile = (eventDetails) => {
  const calendar = ical({ name: "Eventy - Campus Events" });

  calendar.createEvent({
    start: new Date(eventDetails.startDate),
    end: new Date(eventDetails.endDate),
    summary: eventDetails.name || eventDetails.summary,
    description: eventDetails.description || "",
    location: eventDetails.location || "TBD",
    url: eventDetails.url || "http://localhost:5000",
    organizer: {
      name: "Eventy Events Office",
      email: process.env.EMAIL_USER || "events@eventy.com",
    },
    status: "CONFIRMED",
    busyStatus: "BUSY",
    alarms: [
      {
        type: "display",
        trigger: 60 * 24, // 1 day before
        description: "Event reminder: " + (eventDetails.name || "Event"),
      },
      {
        type: "display",
        trigger: 30, // 30 minutes before
        description: "Event starting soon: " + (eventDetails.name || "Event"),
      },
    ],
  });

  return calendar.toString();
};

/**
 * Generate ICS file for multiple events
 */
export const generateICSFileForMultipleEvents = (events) => {
  const calendar = ical({ name: "Eventy - Campus Events" });

  events.forEach((eventDetails) => {
    calendar.createEvent({
      start: new Date(eventDetails.startDate),
      end: new Date(eventDetails.endDate),
      summary: eventDetails.name || eventDetails.summary,
      description: eventDetails.description || "",
      location: eventDetails.location || "TBD",
      url: eventDetails.url || "http://localhost:5000",
      organizer: {
        name: "Eventy Events Office",
        email: process.env.EMAIL_USER || "events@eventy.com",
      },
      status: "CONFIRMED",
      busyStatus: "BUSY",
    });
  });

  return calendar.toString();
};

/**
 * Generate Google Calendar add-to-calendar link
 */
export const generateGoogleCalendarLink = (eventDetails) => {
  const startDate = new Date(eventDetails.startDate);
  const endDate = new Date(eventDetails.endDate);

  // Format dates as YYYYMMDDTHHmmssZ
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventDetails.name || eventDetails.summary,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: eventDetails.description || "",
    location: eventDetails.location || "TBD",
    trp: "false",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook calendar link
 */
export const generateOutlookCalendarLink = (eventDetails) => {
  const startDate = new Date(eventDetails.startDate).toISOString();
  const endDate = new Date(eventDetails.endDate).toISOString();

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: eventDetails.name || eventDetails.summary,
    startdt: startDate,
    enddt: endDate,
    body: eventDetails.description || "",
    location: eventDetails.location || "TBD",
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Apple Calendar (iCal) link
 */
export const generateAppleCalendarLink = (eventDetails) => {
  // Apple Calendar uses ICS files
  return generateICSFile(eventDetails);
};
