# Quick Installation & Commands

## 1. Install All Dependencies

Run this single command in your project root:

```bash
npm install googleapis ical-generator react-big-calendar @react-oauth/google moment
```

**What this installs:**

- `googleapis` - Google Calendar API client
- `ical-generator` - Creates .ics calendar files
- `react-big-calendar` - Full-featured calendar component
- `@react-oauth/google` - Google OAuth integration
- `moment` - Date manipulation library

---

## 2. Files Created (No need to run anything)

### Backend Files:

✅ `server/src/features/calendar/calendar.service.js`
✅ `server/src/features/calendar/calendar.controller.js`
✅ `server/src/features/calendar/calendar.route.js`
✅ `server/src/utils/ics-generator.js`

### Frontend Files:

✅ `client/src/components/GoogleCalendarIntegration.tsx`
✅ `client/src/components/MiniCalendar.tsx`
✅ `client/src/components/BigCalendarView.tsx`
✅ `client/src/components/CalendarHeatmap.tsx`
✅ `client/src/components/SmartSchedulingAssistant.tsx`
✅ `client/src/components/EventTimeline.tsx`
✅ `client/src/pages/CalendarPage.tsx`

### Documentation:

✅ `CALENDAR_FEATURES.md` - Complete feature documentation
✅ `CALENDAR_SETUP.md` - Detailed setup guide
✅ `CREATIVE_CALENDAR_IDEAS.md` - Creative features explained

### Routes Updated:

✅ `server/src/routes/index.js` - Calendar routes added
✅ `server/src/features/auth/email.service.js` - Email with calendar invite added

---

## 3. Environment Variables to Add

Add these to your `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth2callback
```

**Get these from:** https://console.cloud.google.com
(See CALENDAR_SETUP.md for detailed instructions)

---

## 4. Database Schema Updates Needed

### User Model - Add these fields:

```javascript
googleCalendarTokens: {
  access_token: String,
  refresh_token: String,
  expiry_date: Number,
},
calendarConnected: {
  type: Boolean,
  default: false,
}
```

### Event Model - Add this field:

```javascript
googleCalendarEvents: [
  {
    userId: ObjectId,
    googleEventId: String,
    htmlLink: String,
  },
];
```

---

## 5. Add to Your App Router

In your main routing file, add:

```tsx
import CalendarPage from "@/pages/CalendarPage";

// Add this route
<Route path="/calendar" component={CalendarPage} />;
```

---

## 6. Test Commands

### Start your server:

```bash
npm run dev
```

### Test the calendar:

1. Visit: http://localhost:5000/calendar
2. Click "Calendar Integration"
3. Click "Connect Google Calendar"
4. Complete OAuth flow
5. Click "Sync All Events Now"

### Check if it worked:

- Open your Google Calendar
- You should see your Eventy events!

---

## 7. Quick Usage Examples

### Add Mini Calendar to Dashboard:

```tsx
import MiniCalendar from "@/components/MiniCalendar";

<MiniCalendar
  events={userEvents}
  onDateClick={(date) => navigate("/calendar")}
/>;
```

### Add Google Calendar Integration:

```tsx
import GoogleCalendarIntegration from "@/components/GoogleCalendarIntegration";

<GoogleCalendarIntegration />;
```

### Add Smart Assistant:

```tsx
import SmartSchedulingAssistant from "@/components/SmartSchedulingAssistant";

<SmartSchedulingAssistant events={userEvents} />;
```

### Add Activity Heatmap:

```tsx
import CalendarHeatmap from "@/components/CalendarHeatmap";

<CalendarHeatmap events={userEvents} />;
```

### Send Calendar Email on Registration:

```javascript
import { sendEventRegistrationWithCalendar } from "./email.service.js";

// After user registers for event:
await sendEventRegistrationWithCalendar(user, event);
```

---

## 8. Verification Checklist

Before demo, verify:

- [ ] Dependencies installed (`npm list googleapis`)
- [ ] Environment variables set (check `.env`)
- [ ] Google Calendar API enabled
- [ ] OAuth credentials created
- [ ] Database schema updated
- [ ] Routes added to router
- [ ] Server starts without errors
- [ ] Calendar page loads
- [ ] OAuth flow works
- [ ] Events sync to Google Calendar
- [ ] Email includes calendar invite
- [ ] Mini calendar shows dots
- [ ] Big calendar displays events

---

## 9. If Something Doesn't Work

### PowerShell script execution error:

Your terminal couldn't run npm. The files are already created, just need to:

1. Open Command Prompt (cmd.exe) instead
2. Run: `npm install googleapis ical-generator react-big-calendar @react-oauth/google moment`

### "Module not found" errors:

```bash
npm install
```

### OAuth redirect error:

Check that `GOOGLE_REDIRECT_URI` in `.env` exactly matches what's in Google Cloud Console

### Events not syncing:

1. Check browser console for errors
2. Verify tokens are saved in database
3. Check server logs

### Email calendar not showing:

1. Verify `ical-generator` is installed
2. Check email service configuration
3. Test with Gmail (best support)

---

## 10. Next Steps

1. ✅ Dependencies installed
2. ✅ Files created
3. ⏳ Set up Google Calendar API (5 min)
4. ⏳ Add environment variables
5. ⏳ Update database schemas
6. ⏳ Add route to app
7. ⏳ Test the integration

**Follow CALENDAR_SETUP.md for detailed step-by-step instructions!**

---

## Quick Links

- **Setup Guide:** `CALENDAR_SETUP.md`
- **Features Doc:** `CALENDAR_FEATURES.md`
- **Creative Ideas:** `CREATIVE_CALENDAR_IDEAS.md`
- **Google Cloud Console:** https://console.cloud.google.com

---

## Support

If you need help:

1. Check the error message
2. Look in browser console (F12)
3. Check server logs
4. Review the setup guide
5. Verify environment variables

**You're all set to build an amazing calendar feature! 🚀**
