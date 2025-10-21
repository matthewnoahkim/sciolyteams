# RSVP Feature Implementation

## Overview
Added RSVP (Yes/No) functionality to calendar events, allowing users to respond and see who's going or not going to team and subteam events.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `RSVPStatus` enum with values `YES` and `NO`
- Created `EventRSVP` model to track user responses to calendar events
- Added `eventRSVPs` relation to `User` model
- Added `rsvps` relation to `CalendarEvent` model

### 2. API Endpoints

#### Created: `/api/calendar/[eventId]/rsvp/route.ts`
- **POST**: Create or update RSVP (upsert operation)
  - Body: `{ status: 'YES' | 'NO' }`
  - Returns the created/updated RSVP with user info
- **DELETE**: Remove RSVP
  - Removes user's RSVP for the event

#### Updated: `/api/calendar/route.ts`
- Modified GET and POST endpoints to include `rsvps` with user info in responses

#### Updated: `/api/calendar/[eventId]/route.ts`
- Modified PATCH endpoint to include `rsvps` in response

### 3. UI Components

#### Updated: `src/components/tabs/calendar-tab.tsx`
- Added RSVP state management (`rsvping`)
- Added `handleRSVP()` function with optimistic updates
- Added `handleRemoveRSVP()` function with optimistic updates
- Added `getUserRSVP()` helper to get current user's RSVP status
- Added `getRSVPCounts()` helper to calculate yes/no counts
- Updated Event Details Dialog to show:
  - RSVP buttons (Going/Not Going/Clear)
  - Visual feedback for user's current RSVP status
  - List of users who are going (with avatars and names)
  - List of users who are not going (with avatars and names)
  - RSVP counts for each status
- RSVP section only shown for TEAM and SUBTEAM events (not PERSONAL)

#### Updated: `src/components/team-page.tsx`
- Added `user` prop to `CalendarTab` component
- Updated `TeamPageProps` interface to include `user.id`

### 4. Features

#### Real-time Sync
- Events are refetched after RSVP operations to ensure data consistency
- All users see the latest RSVP data when viewing event details

#### Optimistic Updates
- UI updates immediately when user clicks Going/Not Going
- If API call fails, UI reverts to previous state
- Provides instant feedback for better UX

#### User Experience
- Clear visual indicators (checkmark for Going, X for Not Going)
- User avatars and names displayed for all RSVPs
- Shows displayName (user.name) or email if name not set
- Counts displayed for both Going and Not Going
- "Clear" button to remove RSVP
- Disabled state while RSVP is being submitted

## Database Migration

To apply the database changes, run:

```bash
npx prisma migrate dev --name add_event_rsvp
```

Or for production:

```bash
npx prisma migrate deploy
```

## Testing Checklist

- [ ] Create a team event and RSVP "Going"
- [ ] Verify RSVP appears in event details
- [ ] Change RSVP to "Not Going"
- [ ] Verify count updates correctly
- [ ] Clear RSVP and verify it's removed
- [ ] Test with multiple users RSVPing
- [ ] Verify optimistic updates work (UI updates immediately)
- [ ] Test error handling (disconnect network, verify UI reverts)
- [ ] Verify personal events don't show RSVP section
- [ ] Test RSVP on subteam events
- [ ] Verify user names/emails display correctly

## Notes

- Personal events (`scope: 'PERSONAL'`) do not have RSVP functionality
- Only team members can RSVP to events
- Each user can have only one RSVP per event (Yes or No)
- RSVPs are stored by User ID, not Membership ID, for consistency
- Optimistic updates provide instant feedback before server confirmation

