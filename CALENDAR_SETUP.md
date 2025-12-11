# Calendar Integration Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install googleapis ical-generator react-big-calendar @react-oauth/google moment
```

### Step 2: Set Up Google Calendar API

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name: "Eventy Calendar Integration"
   - Click "Create"

3. **Enable Google Calendar API**
   - In the sidebar: APIs & Services → Library
   - Search for "Google Calendar API"
   - Click on it → Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Sidebar: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: External
     - App name: Eventy
     - User support email: your email
     - Developer contact: your email
     - Click "Save and Continue"
     - Scopes: Skip for now
     - Test users: Add your email
     - Click "Save and Continue"
   - Back to Create OAuth client ID:
     - Application type: Web application
     - Name: Eventy Web Client
     - Authorized redirect URIs:
       - `http://localhost:5000/api/calendar/oauth2callback`
       - `http://localhost:4000/api/calendar/oauth2callback`
     - Click "Create"

5. **Copy Credentials**
   - You'll see a dialog with Client ID and Client Secret
   - **IMPORTANT:** Copy these values!

### Step 3: Update Environment Variables

Create or update `.env` in your project root:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth2callback

# Make sure these are also set
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Step 4: Update Database Schema

If using MongoDB/Mongoose, update your User model:

```javascript
// In your User model file
const userSchema = new mongoose.Schema({
  // ... existing fields ...

  // Add these fields
  googleCalendarTokens: {
    access_token: String,
    refresh_token: String,
    expiry_date: Number,
  },
  calendarConnected: {
    type: Boolean,
    default: false,
  },
});
```

If using another database, add equivalent columns.

### Step 5: Update Event Model

```javascript
// In your Event model file
const eventSchema = new mongoose.Schema({
  // ... existing fields ...

  // Add this field
  googleCalendarEvents: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      googleEventId: String,
      htmlLink: String,
    },
  ],
});
```

### Step 6: Add Routes to Your App

The calendar routes are already imported in `server/src/routes/index.js`. Verify:

```javascript
import calendarRoutes from "../features/calendar/calendar.route.js";
// ...
router.use("/calendar", calendarRoutes);
```

### Step 7: Add Calendar Page to Frontend Router

In your main app file (e.g., `App.tsx`):

```tsx
import CalendarPage from "@/pages/CalendarPage";

// Add to your routes
<Route path="/calendar" component={CalendarPage} />;
```

### Step 8: Add Calendar Link to Navigation

In your header/navigation component:

```tsx
<Link to="/calendar">
  <Calendar className="h-4 w-4 mr-2" />
  Calendar
</Link>
```

### Step 9: Test the Integration

1. **Start your server**

   ```bash
   npm run dev
   ```

2. **Navigate to Calendar page**
   - Go to http://localhost:5000/calendar

3. **Connect Google Calendar**
   - Click "Calendar Integration" button
   - Click "Connect Google Calendar"
   - Authorize the app
   - You should be redirected back

4. **Sync Events**
   - Click "Sync All Events Now"
   - Check your Google Calendar - events should appear!

5. **Test Email Invites**
   - Register for an event
   - Check your email
   - Try clicking "Add to Google Calendar"
   - Try opening the ICS attachment

---

## Troubleshooting

### "OAuth Error: redirect_uri_mismatch"

**Solution:** Make sure your redirect URI in Google Cloud Console exactly matches:

```
http://localhost:5000/api/calendar/oauth2callback
```

(No trailing slash, correct port number)

### "Calendar not connected" error

**Solution:**

1. Check browser console for errors
2. Verify environment variables are loaded
3. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
4. Restart your server after adding env variables

### Events not appearing in Google Calendar

**Solution:**

1. Check if `calendarConnected` is `true` in your user document
2. Verify tokens are stored in database
3. Check server logs for API errors
4. Try disconnecting and reconnecting

### ICS file not attaching to emails

**Solution:**

1. Make sure `ical-generator` is installed
2. Check email service logs
3. Verify `generateICSFile` function is imported correctly
4. Test with a simple email first

### "Failed to sync calendar" error

**Solution:**

1. Check if events have valid `startDate` and `endDate`
2. Verify user is registered for events (in `attendees` array)
3. Check API quota limits in Google Cloud Console
4. Look for detailed error in server logs

---

## Using the Components

### Add Mini Calendar to Dashboard

```tsx
import MiniCalendar from "@/components/MiniCalendar";

function Dashboard() {
  const [events, setEvents] = useState([]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">{/* Main content */}</div>
      <div>
        <MiniCalendar
          events={events}
          onDateClick={(date) => {
            navigate(`/calendar?date=${date.toISOString()}`);
          }}
        />
      </div>
    </div>
  );
}
```

### Add Google Calendar Integration to Settings

```tsx
import GoogleCalendarIntegration from "@/components/GoogleCalendarIntegration";

function Settings() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold mb-4">Calendar Integration</h2>
        <GoogleCalendarIntegration />
      </section>
    </div>
  );
}
```

### Add Smart Assistant to Profile

```tsx
import SmartSchedulingAssistant from "@/components/SmartSchedulingAssistant";
import CalendarHeatmap from "@/components/CalendarHeatmap";

function Profile() {
  const [events, setEvents] = useState([]);

  return (
    <div className="space-y-6">
      <SmartSchedulingAssistant events={events} />
      <CalendarHeatmap events={events} />
    </div>
  );
}
```

### Update Event Registration to Send Calendar Emails

In your event registration controller:

```javascript
import { sendEventRegistrationWithCalendar } from "../auth/email.service.js";

export const registerForEvent = async (req, res) => {
  try {
    // ... your existing registration logic ...

    // After successful registration, send calendar email
    await sendEventRegistrationWithCalendar(user, event);

    res.json({ success: true, message: "Registered successfully" });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## Testing Checklist

- [ ] Google Calendar OAuth flow works
- [ ] Events sync to Google Calendar
- [ ] Mini calendar shows event dots
- [ ] Hovering on dates shows tooltips
- [ ] Clicking dates navigates to big calendar
- [ ] Big calendar displays events correctly
- [ ] Event details dialog opens on click
- [ ] Email includes ICS attachment
- [ ] "Add to Google Calendar" button works
- [ ] Gmail shows calendar prompt
- [ ] Smart Assistant detects conflicts
- [ ] Heatmap displays activity correctly
- [ ] Timeline shows countdown timers
- [ ] Export calendar downloads ICS file

---

## Security Best Practices

1. **Never commit `.env` file**

   ```bash
   # Add to .gitignore
   .env
   .env.local
   ```

2. **Use environment variables**
   - Never hardcode credentials
   - Use `process.env.VARIABLE_NAME`

3. **Validate OAuth tokens**
   - Check expiry before using
   - Refresh when needed
   - Handle errors gracefully

4. **Secure callback URLs**
   - Only whitelist your domains
   - Use HTTPS in production

5. **Rate limiting**
   - Google Calendar API has quotas
   - Implement caching where possible
   - Batch operations when feasible

---

## Production Deployment

### Update Redirect URIs

In Google Cloud Console, add production URL:

```
https://yourdomain.com/api/calendar/oauth2callback
```

### Update Environment Variables

```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/oauth2callback
```

### SSL Certificate

- Use HTTPS in production
- Get SSL certificate (Let's Encrypt is free)
- Update all calendar URLs to HTTPS

### OAuth Consent Screen

- Submit app for verification (if needed)
- Add logo and privacy policy
- Complete all required fields

---

## API Rate Limits

Google Calendar API limits:

- 1,000,000 queries per day
- 600 queries per minute per user
- 10 queries per second per user

**Tips to stay within limits:**

- Cache calendar data
- Batch operations
- Only sync when needed
- Implement exponential backoff on errors

---

## Need Help?

1. Check the main documentation: `CALENDAR_FEATURES.md`
2. Review code comments in the source files
3. Check browser console for frontend errors
4. Check server logs for backend errors
5. Verify all environment variables are set

---

## Success! 🎉

If you've completed all steps:

- Your calendar is now fully integrated!
- Users can sync to Google Calendar
- Emails include calendar invites
- Smart features are active

**Next steps:**

- Add the calendar page to your navigation
- Promote the feature to users
- Monitor API usage in Google Cloud Console
- Consider adding more creative features!
