# Event to Stream Announcement Feature

## Overview

When captains create calendar events for the entire club or specific teams, they now have the option to automatically post these events to the team stream with RSVP functionality. This creates a seamless experience where events can be discovered, discussed, and responded to directly from the stream.

## How It Works

### 1. Creating Events

When a captain creates a **TEAM** or **SUBTEAM** scoped event in the calendar:

1. The event is saved to the calendar as usual
2. A modal automatically appears asking: "Post Event to Stream?"
3. The captain can choose to:
   - **Post to stream** (with event details and RSVP)
   - **Send email notifications** to everyone
   - **Skip** (event only appears in calendar)

### 2. Event Announcements in Stream

When posted to the stream, event announcements display:

- 📅 **Event date and time** (formatted for all-day or timed events)
- 📍 **Location** (if specified)
- **RSVP buttons** (Going / Not Going / Clear)
- **Live RSVP counts** with avatars showing who's going/not going
- All standard announcement features (reactions, replies, etc.)

### 3. Bi-Directional Sync

Events and their linked announcements stay in sync:

#### Calendar → Stream
- **Edit event title in calendar** → Updates announcement title in stream
- **Delete event in calendar** → Deletes linked announcement from stream

#### Stream → Calendar
- **Edit announcement title in stream** → Updates calendar event title
- **Delete announcement in stream** → Deletes linked calendar event
- **RSVP in stream** → Updates calendar RSVPs (visible in both places)

### 4. RSVP Syncing

RSVPs are stored with the calendar event and are visible in:
- **Calendar tab**: Full RSVP interface with lists of attendees
- **Stream tab**: Same RSVP data shown in the event announcement
- **Both locations update in real-time** when RSVPs change

## User Experience

### For Captains

**Creating an Event:**
1. Go to Calendar tab
2. Click "New Event"
3. Fill in event details (title, date, location, etc.)
4. Select scope: "Entire club" or "Specific team"
5. Click "Create Event"
6. **NEW**: Modal appears
   - ✅ "Post this event to the team stream"
   - ✅ "Send email notification to everyone" (optional)
7. Click "Post to Stream" or "Skip"

**Managing Events:**
- Edit title in Calendar → Automatically updates in Stream
- Edit title in Stream → Automatically updates in Calendar
- Delete from either location → Removes from both

### For All Members

**Viewing Events in Stream:**
- See event details in a highlighted card
- Click "Going" or "Not Going" to RSVP
- View who else has RSVP'd
- Reply and react just like any announcement

**Viewing Events in Calendar:**
- See all calendar events as usual
- RSVP from calendar view
- RSVPs sync with stream announcements

## Technical Implementation

### Database Schema
- Added `calendarEventId` field to `Announcement` model (unique, optional)
- Added `announcement` relation to `CalendarEvent` model
- One-to-one relationship (one event can have one announcement)

### API Changes

**Announcements API** (`/api/announcements`)
- Accepts `calendarEventId` when creating announcements
- Includes calendar event data (with RSVPs) in GET responses
- PATCH: Syncs title updates to linked calendar events
- DELETE: Also deletes linked calendar events

**Calendar Events API** (`/api/calendar/[eventId]`)
- PATCH: Syncs title updates to linked announcements
- DELETE: Also deletes linked announcements

### Components

**EventAnnouncementModal**
- New modal component
- Shown after creating TEAM/SUBTEAM events
- Checkbox options for posting to stream and sending emails

**Calendar Tab Updates**
- Shows modal after event creation
- Formats event details for announcement content
- Handles announcement creation via API

**Stream Tab Updates**
- Displays event details card for event-linked announcements
- Full RSVP interface with buttons and attendee lists
- Uses same RSVP handlers as calendar
- Formats event times for display

## Edge Cases Handled

1. **Personal events**: Never show the modal (only for TEAM/SUBTEAM)
2. **Member creates event**: Modal doesn't show (only captains can post to stream)
3. **Skip posting**: Event exists only in calendar, no announcement created
4. **Delete announcement**: Linked calendar event is also deleted
5. **Delete calendar event**: Linked announcement is also deleted
6. **Edit title**: Syncs in both directions (calendar ↔ stream)
7. **RSVP from stream**: Updates calendar RSVPs
8. **RSVP from calendar**: Updates stream announcement display

## Benefits

1. **Better Visibility**: Events reach team members in multiple places
2. **Reduced Duplication**: Captains don't need to create separate announcements
3. **Consistent Data**: RSVPs and details stay synced automatically
4. **Conversation**: Team can discuss events via replies
5. **Engagement**: Reactions and replies add social context to events
6. **Email Notifications**: Optional email alerts for important events

## Future Enhancements

Potential improvements:
- Edit event location/time from stream
- Reminder notifications for upcoming events
- Export RSVPs to other formats
- Recurring event support
- Calendar integration (iCal/Google Calendar export)


