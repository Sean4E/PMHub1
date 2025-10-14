# Activity Feed System - Complete Guide

**Last Updated**: 2025-10-14
**Version**: v01.024
**Purpose**: Comprehensive guide to what gets logged and how admins/managers interact with activity data

---

## Overview

The PM Hub ecosystem has a **real-time unified activity feed** that captures all significant actions across the Hub, Manager, and Worker applications. This provides complete visibility into project activity and team performance.

---

## What Gets Logged

### Activity Sources

Activities come from three sources:

| Source | App | Icon | What It Tracks |
|--------|-----|------|----------------|
| **Worker** | Worker App | 📱 | Field operations: clock in/out, task progress, reports, tool usage |
| **Manager** | Manager App | ⚙️ | Management actions: task creation, area setup, team assignments |
| **Hub** | Hub App | 🖥️ | Administrative actions: project creation, user management, system changes |

### Activity Types

All activities are categorized by type with unique icons and colors:

| Type | Icon | Color | When It Logs | Data Captured |
|------|------|-------|--------------|---------------|
| **CLOCK_IN** | ⏰ | Green | Worker clocks in to shift | Worker name, timestamp, project |
| **CLOCK_OUT** | 🏁 | Red | Worker clocks out of shift | Worker name, timestamp, total hours worked |
| **TASK_START** | ▶️ | Blue | Worker starts a task | Task name, WBS, area, project, worker, start time |
| **TASK_COMPLETE** | ✅ | Green | Worker completes a task | Task name, WBS, completion time, billable status, hours |
| **REPORT** | 📸 | Purple | Worker uploads photos/report | Number of photos, task name, reports folder link |
| **TOOL_CHECKOUT** | 🔧 | Blue | Worker checks out a tool | Tool name, worker, checkout time |
| **TOOL_CHECKIN** | ✓ | Green | Worker returns a tool | Tool name, worker, return time |
| **TASK_ADDED** | 📋 | Default | Hub/Manager creates task | Task name, WBS, area, assignee, creator |
| **AREA_COMPLETE** | 🎉 | Orange | All tasks in area complete | Area name, project, completion time |
| **AREA_CREATED** | 📍 | Default | New area created | Area name, project, creator |
| **USER_CREATED** | 👤 | Default | New user added to team | User name, role, added by |
| **TASK_MESSAGE** | 💬 | Purple | Chat message sent | Task name, message preview, sender |
| **INVOICE_CREATE** | 💰 | Orange | Invoice generated | Amount, project, billable hours |

---

## Activity Data Structure

Each activity contains the following fields:

```javascript
{
    id: "1728912345678",              // Unique ID (timestamp)
    timestamp: "2025-10-14T10:30:00Z", // ISO 8601 timestamp
    type: "TASK_START",                // Activity type (see table above)
    message: "Started: Install fixtures", // Human-readable message
    userId: "user123",                 // User who performed action
    userName: "John Smith",            // User's display name
    source: "worker",                  // App that generated activity (worker/manager/hub)
    projectId: "24001",                // Associated project ID
    projectName: "Office Renovation",  // Associated project name
    details: {                         // Type-specific additional data
        taskName: "Install fixtures",
        taskWbs: "1.2",
        areaName: "Electrical",
        driveFolderId: "abc123xyz",    // Google Drive folder for task
        billable: true,
        hours: 2.5
    }
}
```

---

## How Admins/Managers Interact with Activity Cards

### 1. Activity Feed Interface

**Location**:
- **Hub**: Activity section (📊 Activity tab)
- **Manager**: Management menu → Activity Log

**Features**:
- Real-time updates (no refresh needed - updates appear within 0.5-1 second)
- Live indicator shows connection status
- Total activity count and daily stats
- Filter by source, type, user, and project

### 2. Filtering Activities

Four powerful filters allow precise activity tracking:

#### Filter by Source
```
All Sources / 📱 Worker / ⚙️ Manager / 🖥️ Hub
```
**Use Case**: "Show me only what workers did today"

#### Filter by Type
```
All Activities / Clock In/Out / Task Start / Task Complete /
Area Complete / Tool Checkout / Reports / Messages
```
**Use Case**: "Show me all completed tasks this week"

#### Filter by User
```
All Users / John Smith / Jane Doe / etc.
```
**Use Case**: "Track a specific worker's productivity"

#### Filter by Project
```
All Projects / Office Renovation / Shopping Center / etc.
```
**Use Case**: "See all activity for one project"

### 3. Viewing Activity Details

**Basic View** (In Activity Feed):
- Activity icon and type
- User who performed action
- Time (relative + exact timestamp)
- Quick inline details (billable status, hours, photo count)
- Source badge (Worker/Manager/Hub)

**Expanded View** (Click "View Details" button):

Every activity card has a **"View Details"** button that opens a modal with:

1. **Large Activity Icon** - Visual type indicator
2. **Full Message** - Complete description of what happened
3. **User Information** - Who performed the action
4. **Precise Timestamp** - Exact date and time (formatted: `10/14/2025, 10:30:45 AM`)
5. **Project Context** - Which project this relates to
6. **Extended Details Panel** - All captured data fields:
   - Task name and WBS number
   - Area name
   - Billable status (💰 Billable / 📝 Non-billable)
   - Hours logged
   - Photo/file counts
   - Invoice requirements
   - Custom data fields

### 4. Action Buttons in Detail View

Based on activity type, the detail modal provides **actionable buttons**:

#### For REPORT Activities:
```
📂 Open Reports Folder
```
- Direct link to Google Drive folder with uploaded photos
- Opens in new tab
- Location: `details.reportsFolderId`

#### For TASK_START / TASK_COMPLETE Activities:
```
📁 Open Task Folder
```
- Direct link to task's Google Drive folder
- Opens in new tab
- Contains all task files and documentation
- Location: `details.driveFolderId`

#### For AREA_COMPLETE Activities:
```
📁 Open Area Folder
```
- Direct link to area's Google Drive folder
- Opens in new tab
- Contains all area documentation
- Location: `details.areaFolderId`

**Example - Manager Clicks on Worker's Photo Report:**

1. Worker uploads 5 photos at 2:30 PM
2. Manager sees activity card appear immediately: "📸 REPORT - Uploaded 5 photos"
3. Card shows inline: "📸 5/5 files uploaded"
4. Manager clicks **"View Details"** button
5. Modal opens showing:
   - Large camera icon
   - "John Smith uploaded 5 photos to 'Install fixtures'"
   - Time: October 14, 2025, 2:30:15 PM
   - Project: Office Renovation
   - Details panel: Task name, area, photo count
   - **Action Button**: "📂 Open Reports Folder"
6. Manager clicks folder button → Opens Google Drive with photos

---

## Real-Time Behavior

### Instant Updates

Activities appear in Hub/Manager feeds **immediately** (0.5-1 second delay) when:
- Worker clocks in/out
- Worker starts/completes task
- Worker uploads photos
- Worker checks out/in tools
- Anyone sends a chat message
- Manager creates tasks/areas
- Hub admin makes system changes

### Cross-App Synchronization

```
Worker (Field)          →  Firebase Cloud  →  Hub (Office)
                                ↓
                         Manager (Remote)
```

**Example Flow:**
1. Worker starts task at 10:30:00 AM
2. Firebase receives update at 10:30:00.5 AM
3. Hub receives real-time notification at 10:30:01 AM
4. Manager receives real-time notification at 10:30:01 AM
5. Activity card appears in both Hub and Manager feeds
6. Dashboard updates show task moved to "In Progress" column

### No Polling - No Refresh Needed

The system uses **Firebase onSnapshot listeners** (not polling):
- Zero manual refresh required
- No "Refresh" button needed (though available)
- Minimal bandwidth usage (only sends changes)
- Battery efficient on mobile devices

---

## Practical Use Cases

### Use Case 1: Daily Worker Tracking

**Goal**: See what all workers did today

**Steps**:
1. Open Activity section
2. Filter by Source: "📱 Worker"
3. View today's count in stats panel
4. Click "View Details" on any activity to see full context
5. Click folder links to review uploaded work

**Result**: Complete visibility into daily field operations

---

### Use Case 2: Task Completion Audit

**Goal**: Verify all tasks marked complete were actually finished with photos

**Steps**:
1. Filter by Type: "Task Complete"
2. Filter by Project: [Specific Project]
3. For each completion:
   - Click "View Details"
   - Check if `details.mediaCount` exists
   - Click "📂 Open Reports Folder" to view proof photos
   - Verify billable status

**Result**: Quality assurance on completed work

---

### Use Case 3: Worker Productivity Report

**Goal**: Generate performance metrics for specific worker

**Steps**:
1. Filter by User: [Worker Name]
2. Filter by Type: "Task Complete"
3. Check stats panel for completion count
4. Review activity details for hours logged
5. Export data (future feature) or screenshot for reports

**Result**: Individual performance tracking

---

### Use Case 4: Project Timeline Reconstruction

**Goal**: See complete history of a project's activity

**Steps**:
1. Filter by Project: [Project Name]
2. Activities show in chronological order (newest first)
3. Scroll through timeline to see:
   - When project started (first activity)
   - All task completions
   - Worker assignments
   - Reports uploaded
   - Areas completed
4. Click details on key milestones

**Result**: Complete project audit trail

---

### Use Case 5: Invoice Preparation

**Goal**: Identify all billable work for invoicing

**Steps**:
1. Filter by Type: "Task Complete"
2. Filter by Project: [Client Project]
3. Look for activities with:
   - "💰 Billable" badge in details
   - "🔔 Ready to Invoice" indicator
4. Click "View Details" to see hours
5. Aggregate hours for invoice

**Result**: Accurate billable time tracking

---

## Activity Feed Stats Panel

At the top of the activity feed, real-time statistics display:

```
┌─────────────────────────────────────────────────┐
│  Total Activities: 247                          │
│  Today: 18                                      │
│  Tasks Complete: 156                            │
│  Areas Complete: 12                             │
└─────────────────────────────────────────────────┘
```

These update in real-time as new activities occur.

---

## Technical Implementation Notes

### Files Involved

| File | Function | Lines |
|------|----------|-------|
| **PM_Hub_CL_v01_024.html** | Hub activity feed | 9876-10190 |
| **manager.html** | Manager activity feed | 3852-4085 |
| **pm-hub-firebase.js** | Worker activity logging | 274-320 |
| **pm-hub-realtime.js** | Real-time sync system | 1-442 |

### Key Functions

#### Hub Functions
```javascript
renderActivityFeed()              // Main render function (line 9876)
showActivityDetails(index)        // Detail modal display (line 10066)
renderActivityDetails(details)    // Inline details render (line 10021)
getActivityIcon(type)             // Icon mapping (line 10149)
getActivityColor(type)            // Color mapping (line 10165)
```

#### Manager Functions
```javascript
renderManagerActivityFeed()       // Main render function (line 3852)
refreshManagerActivity()          // Manual refresh (line 4080)
```

#### Worker Logging
```javascript
firebaseOps.logActivity(type, message, data)  // Log any activity (line 274)
firebaseOps.updateTask(...)                   // Logs TASK_START/COMPLETE
firebaseOps.addPhotoReport(...)               // Logs REPORT
```

### Data Storage

Activities are stored in **two arrays** that get merged:

1. **`hubState.activities`** - Legacy Hub activities
2. **`hubState.activityLog`** - New unified activity log (Worker/Manager)

**Storage Location**: `localStorage` + Firebase `hubs/main` document

**Merge Logic**:
```javascript
const allActivities = [
    ...hubState.activities,
    ...hubState.activityLog
];
```

This ensures backward compatibility while moving to unified system.

---

## Future Enhancements

Potential additions to activity system:

1. **Export to CSV/Excel** - Download activity reports
2. **Advanced Analytics** - Charts and graphs for productivity
3. **Notification Rules** - Alert on specific activity types
4. **Activity Comments** - Add notes to activities
5. **Activity Editing** - Correct mistakes (admin only)
6. **Bulk Actions** - Archive/delete multiple activities
7. **Custom Activity Types** - User-defined activity categories
8. **Activity Search** - Full-text search across all activities

---

## Troubleshooting

### Activities Not Appearing

**Check**:
1. Filter settings (might be filtering out activities)
2. Firebase connection (check console for errors)
3. User source (Worker activities use `source: 'worker'`)

**Fix**: Reset all filters to "All" and check stats panel total count.

### Detail Modal Empty

**Check**:
1. Activity has `details` object
2. Console for JavaScript errors

**Fix**: Some activities (like CLOCK_IN) may have minimal details.

### Folder Links Not Working

**Check**:
1. `details.reportsFolderId` or `details.driveFolderId` exists
2. User has Google Drive access permissions

**Fix**: Ensure Worker uploaded files and Drive folder was created.

---

## Summary

The activity feed is a **complete audit trail** of your PM Hub ecosystem:

✅ **Real-time** - Updates appear within 1 second
✅ **Comprehensive** - Captures all significant actions
✅ **Interactive** - Click to see full details and access files
✅ **Filterable** - Find exactly what you need
✅ **Actionable** - Direct links to Drive folders and resources
✅ **Multi-source** - Unified view across Hub/Manager/Worker

**For Admins**: Complete project oversight and quality control
**For Managers**: Team productivity and task completion tracking
**For Auditing**: Full timeline reconstruction and billable time verification

---

**Related Documentation**:
- [REALTIME_ECOSYSTEM_SUMMARY.md](../architecture/REALTIME_ECOSYSTEM_SUMMARY.md) - Real-time architecture
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick system reference
- [ECOSYSTEM_WORKFLOW_SIMULATION.md](../implementation/ECOSYSTEM_WORKFLOW_SIMULATION.md) - Data flow examples
