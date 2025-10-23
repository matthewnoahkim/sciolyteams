# Attendance System Setup Guide

## Overview

A comprehensive team attendance system has been implemented that tracks attendance for scheduled team and subteam events. This system provides:

- Automatic attendance tracking for team/subteam events
- Time-based check-in windows with configurable grace periods
- Secure code-based check-ins with rate limiting
- Captain-only access to attendance rosters and exports
- Manual check-in capability for captains
- CSV export functionality

## Setup Instructions

### 1. Database Migration

Run the following commands to apply the database schema changes:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply the migration
npx prisma migrate dev --name add_attendance_system
```

If you're deploying to production, use:

```bash
npx prisma migrate deploy
```

### 2. Verify Installation

The following dependencies are already installed:
- `bcryptjs` - For secure code hashing
- `@prisma/client` - Updated with new models

### 3. Database Schema

The following models have been added:

#### Attendance
- Tracks attendance instances for each team/subteam event
- Stores hashed attendance codes
- Manages status (UPCOMING, ACTIVE, ENDED, CANCELLED)
- Configurable grace period

#### AttendanceCheckIn
- Records individual member check-ins
- Tracks check-in source (CODE or MANUAL)
- Stores check-in timestamp
- Links to user and membership

#### AttendanceCodeAttempt
- Rate limiting for code attempts
- Tracks successful and failed attempts
- Links attempts to users and IP addresses

### 4. Features

#### For All Members
- **View Attendance**: See all team events with attendance tracking
- **Check In**: Enter attendance code during meeting hours
- **Status Visibility**: See your own check-in status
- **Real-time Updates**: Event status updates (upcoming → active → ended)

#### For Captains
- **Code Management**: Generate and reveal attendance codes during meetings
- **View Roster**: See complete attendance lists with missing members
- **Manual Check-In**: Add check-ins for members who were present
- **Export Data**: Download attendance as CSV
- **Full Analytics**: See total attendance counts

### 5. Security Features

✅ **Code Security**
- Codes are hashed with bcrypt (never stored in plaintext)
- Codes are only revealed during meeting windows
- Each regeneration invalidates previous codes

✅ **Rate Limiting**
- 5 attempts per 5 minutes per user/IP
- Prevents brute force attacks
- Temporary lockout after limit exceeded

✅ **Access Control**
- Server-side role verification on every request
- Captain-only endpoints for sensitive operations
- Members can only see their own check-in status

✅ **Timezone Handling**
- All times stored in UTC
- Meeting windows calculated server-side
- Grace periods configurable per event

### 6. API Endpoints

```
GET    /api/attendance?teamId=xxx               - List attendance events
GET    /api/attendance/[id]                     - Get attendance details
POST   /api/attendance/[id]/code/regenerate     - Generate new code (captains)
POST   /api/attendance/[id]/checkin             - Check in with code
GET    /api/attendance/[id]/roster              - View roster (captains)
GET    /api/attendance/[id]/export              - Export CSV (captains)
POST   /api/attendance/[id]/manual-checkin      - Manual check-in (captains)
```

### 7. Usage Flow

#### Automatic Setup
1. Captain creates a TEAM or SUBTEAM event in Calendar
2. Attendance record is automatically created
3. Event appears on Attendance tab for all members

#### During Meeting
1. Captain opens Attendance tab
2. Captain clicks "View Details" on active event
3. Captain clicks "Generate New Code"
4. Captain shares 8-character code with members
5. Members enter code to check in
6. Captain can add manual check-ins if needed

#### After Meeting
1. Captain can view final roster
2. Captain can export attendance as CSV
3. Check-in window closes automatically

### 8. CSV Export Format

The exported CSV includes:
- Event ID and title
- Event start/end times
- Team ID
- Member ID, name, and email
- Check-in timestamp
- Source (code or manual)

Example:
```csv
eventId,eventTitle,start,end,teamId,memberId,memberName,memberEmail,checkedInAt,source
clx123,Team Meeting,2024-01-15T10:00:00Z,2024-01-15T11:00:00Z,clt456,clu789,John Doe,john@example.com,2024-01-15T10:05:00Z,code
```

### 9. Configuration Options

#### Grace Period
Default: 0 minutes (can be customized per event)
- Extends check-in window before/after scheduled time
- Example: 5 minute grace = can check in from -5 min to +5 min

#### Rate Limiting
Default: 5 attempts per 5 minutes
- Prevents abuse and brute force
- Tracks by user ID and IP address

### 10. Edge Cases Handled

✅ Overlapping events: Each has its own code and window
✅ Early/late arrivals: Configurable grace periods
✅ Multiple check-in attempts: First valid check-in is kept
✅ Event time changes: Attendance windows update automatically
✅ Event deletion: Attendance records cascade delete
✅ Event cancellation: Check-in is disabled
✅ Recurring events: Each instance has separate attendance

### 11. UI Components

A new "Attendance" tab has been added to the team navigation with:
- Event list with status badges
- Quick check-in buttons
- Captain controls for code generation
- Roster view with missing members
- Export functionality
- Manual check-in dialog

### 12. Testing Checklist

- [ ] Create a team event in Calendar tab
- [ ] Verify attendance record appears in Attendance tab
- [ ] Wait for event to become "Active" (or adjust time)
- [ ] As captain: Generate attendance code
- [ ] As member: Check in with code
- [ ] As captain: View roster
- [ ] As captain: Add manual check-in
- [ ] As captain: Export CSV
- [ ] Test rate limiting (5+ failed attempts)
- [ ] Test grace period boundaries

### 13. Troubleshooting

**Issue: Attendance tab is empty**
- Ensure you have TEAM or SUBTEAM events created (not PERSONAL)
- Check that events were created after this system was installed

**Issue: Cannot generate code**
- Verify event is in "Active" status
- Check that current time is within meeting window
- Ensure you have captain role

**Issue: Cannot check in**
- Verify code is correct (case-insensitive, 8 characters)
- Check that event is "Active"
- Ensure you haven't exceeded rate limit (5 attempts/5 min)

**Issue: Code doesn't work**
- Captain may have regenerated the code (old codes are invalidated)
- Ask captain to regenerate and share new code

### 14. Future Enhancements

Potential additions for future versions:
- QR code generation for quick check-in
- Attendance reports and analytics
- Automatic reminders for upcoming events
- Integration with Google Calendar sync
- Attendance history per member
- Configurable grace periods in UI
- Geofencing for location-based check-in

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.

