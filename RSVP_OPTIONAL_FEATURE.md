# Optional RSVP Feature for Calendar Events

## Overview

The RSVP feature for calendar events is now optional. Captains can choose whether to enable RSVP when creating or editing TEAM and SUBTEAM events.

## Changes Made

### 1. Database Schema

**Added field to `CalendarEvent` model:**
```prisma
rsvpEnabled  Boolean  @default(true)  // Whether RSVP is enabled for this event
```

**Default behavior:**
- New events: RSVP **enabled by default** (checked)
- Existing events: Will default to `true` after migration
- Personal events: RSVP checkbox not shown (doesn't apply)

### 2. API Updates

**Create Event (`POST /api/calendar`)**
- Accepts optional `rsvpEnabled` boolean field
- Defaults to `true` if not provided
- Only applies to TEAM and SUBTEAM events

**Update Event (`PATCH /api/calendar/[eventId]`)**
- Accepts optional `rsvpEnabled` boolean field
- Captains can toggle RSVP on existing events

### 3. UI Changes

#### Create Event Dialog
- New checkbox: **"Enable RSVP for this event"**
- **Checked by default** for TEAM and SUBTEAM events
- Only visible when scope is TEAM or SUBTEAM
- Located after the scope selection section

#### Edit Event Dialog
- Same checkbox available when editing
- Preserves current RSVP setting
- Can be toggled to enable/disable RSVP

#### Event Details View
- RSVP section **only shows if `rsvpEnabled === true`**
- When disabled, no RSVP buttons, counts, or lists appear
- Works for both Calendar tab and event announcements

---

## How It Works

### For Captains Creating Events

**Step 1: Select Scope**
- Choose "Entire club" (TEAM) or "Specific team" (SUBTEAM)

**Step 2: Enable/Disable RSVP** (NEW)
- Checkbox appears: ☑️ "Enable RSVP for this event"
- **Checked by default** - just uncheck if RSVP not needed
- Personal events don't show this option

**Step 3: Create Event**
- Event created with chosen RSVP setting
- Members will see RSVP section only if enabled

### For Members Viewing Events

**RSVP Enabled:**
- See "Your RSVP" section
- Can click "Going" or "Not Going"
- See who else is attending
- Can update or remove RSVP

**RSVP Disabled:**
- No RSVP section shown at all
- Event is informational only
- No attendance tracking via RSVP

### Editing Existing Events

**Captains can:**
- Edit any TEAM/SUBTEAM event
- Toggle the "Enable RSVP" checkbox
- Disable RSVP → Hides from everyone immediately
- Enable RSVP → Members can start responding

---

## Use Cases

### When to Enable RSVP ✅
- Competitions that need attendance count
- Practice sessions with limited spots
- Social events for planning purposes
- Any event where you need to know who's coming

### When to Disable RSVP ❌
- General announcements
- Optional meetings (drop-in style)
- Informational events
- Events where attendance doesn't matter

---

## Migration

**Database migration required:**
```bash
npx prisma migrate dev --name add_rsvp_enabled_field
```

**Migration behavior:**
- Adds `rsvpEnabled` column with default `true`
- All existing events will have RSVP enabled
- No data loss or changes to existing RSVPs

---

## Technical Details

### Files Modified

**Schema:**
- `prisma/schema.prisma` - Added `rsvpEnabled` field

**API:**
- `src/app/api/calendar/route.ts` - Create endpoint
- `src/app/api/calendar/[eventId]/route.ts` - Update endpoint

**UI:**
- `src/components/tabs/calendar-tab.tsx` - Event forms and details view

### Conditional Rendering Logic

```tsx
// RSVP section only shows when:
{selectedEvent.scope !== 'PERSONAL' && selectedEvent.rsvpEnabled && (
  <div className="border-t pt-4">
    {/* RSVP buttons and lists */}
  </div>
)}
```

### Form State

```tsx
// Default form data includes rsvpEnabled
rsvpEnabled: true, // Checked by default for new events
```

---

## Testing Checklist

### Create Event Flow
- [ ] Create TEAM event with RSVP enabled (default)
- [ ] Create TEAM event with RSVP disabled (unchecked)
- [ ] Create SUBTEAM event with RSVP enabled
- [ ] Create SUBTEAM event with RSVP disabled
- [ ] Personal events don't show RSVP checkbox

### Display Behavior
- [ ] Event with RSVP enabled shows RSVP section
- [ ] Event with RSVP disabled hides RSVP section
- [ ] Members can RSVP when enabled
- [ ] No RSVP options when disabled

### Edit Event Flow
- [ ] Edit event and disable RSVP
- [ ] RSVP section disappears for all users
- [ ] Edit event and re-enable RSVP
- [ ] RSVP section reappears
- [ ] Existing RSVPs persist through toggle

### Edge Cases
- [ ] Disabling RSVP doesn't delete existing RSVPs
- [ ] Re-enabling RSVP shows previous RSVPs
- [ ] Members see updated state immediately
- [ ] Works in both create and edit modes

---

## Example Scenarios

### Scenario 1: Competition
```
Event: Regional Competition
Scope: Entire club (TEAM)
RSVP: ✅ Enabled (need headcount for bus)

Result: Members can RSVP, captain sees who's going
```

### Scenario 2: General Announcement
```
Event: Uniform Distribution
Scope: Entire club (TEAM)
RSVP: ❌ Disabled (drop-in, no need to track)

Result: Event appears in calendar, no RSVP buttons
```

### Scenario 3: Team Practice
```
Event: Physics Team Practice
Scope: Specific team (SUBTEAM - Physics)
RSVP: ✅ Enabled (track attendance)

Result: Only Physics team members see it, can RSVP
```

---

## Benefits

1. **Flexibility** - Not every event needs RSVP tracking
2. **Cleaner UI** - No unnecessary RSVP sections
3. **Captain Control** - Toggle per event as needed
4. **Backward Compatible** - Existing events default to enabled
5. **Simple UX** - Just one checkbox, checked by default

---

## Future Enhancements

Potential additions:
- Bulk RSVP enable/disable for multiple events
- Default RSVP preference per team
- RSVP deadline (auto-disable after date)
- Required RSVP (must respond to see event)
- RSVP reminders for events with RSVP enabled

---

**Status:** ✅ Complete and Ready to Use
**Migration Required:** Yes (add `rsvpEnabled` column)
**Breaking Changes:** None (defaults to enabled)

