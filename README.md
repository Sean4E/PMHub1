# PM Hub Ecosystem

A comprehensive, real-time project management system with multi-user collaboration, Google Drive integration, and Firebase sync.

## 🚀 Quick Start

1. **Login**: Open `index.html` - Use PIN `0000` for admin access
2. **Admin Hub**: `PM_Hub_CL_v01_024.html` - Full project management interface
3. **Manager App**: `manager.html` - Task management and team oversight
4. **Worker App**: `worker.html` - Task execution and progress tracking

## 📁 Project Structure

### Main Application Files
- `index.html` - Login page with Firebase & Google Drive initialization
- `PM_Hub_CL_v01_024.html` - Admin hub (full access)
- `manager.html` - Manager interface
- `worker.html` - Worker interface
- `pm-hub-realtime.js` - Real-time sync engine
- `pm-hub-auth.js` - Authentication module
- `pm-hub-core.js` - Core functionality
- `pm-hub-styles.css` - Shared styles

### Assets
- `Logos/` - Company logos and branding assets
- `Modules/` - Additional feature modules

### Documentation (`DOCUMENTATION/`)

#### Setup Guides (`setup-guides/`)
- `CORRECT_SETUP_WORKFLOW.md` - Proper setup for multi-user Google Drive
- `MULTI_USER_SETUP_GUIDE.md` - Complete multi-user configuration
- `GOOGLE_DRIVE_MULTI_USER_FAQ.md` - Common questions about Drive setup
- `REAL_WORLD_MULTI_USER_SOLUTION.md` - Real-world deployment scenarios
- `REALTIME_SYNC_GUIDE.md` - Firebase real-time sync setup

#### Health Reports (`health-reports/`)
- `ECOSYSTEM_HEALTH_CHECK.md` - System health verification
- `ECOSYSTEM_HEALTH_REPORT.md` - Detailed health analysis
- `REALTIME_SYNC_DIAGNOSTICS.md` - Sync diagnostics and testing
- `REALTIME_SYNC_VERIFICATION.md` - Sync verification procedures

#### Implementation Notes (`implementation-notes/`)
- `CHAT_IMPLEMENTATION_SUMMARY.md` - Task-level chat implementation
- `CHAT_IMPROVEMENTS_2025.md` - Chat system enhancements
- `CHAT_TESTING_GUIDE.md` - Testing chat functionality
- `HUB_CHAT_AND_ICONS_FIX.md` - Hub-specific chat fixes
- `INTEGRATION_COMPLETE.md` - Integration completion notes
- `INTEGRATION_PLAN.md` - Original integration planning
- `IMPROVED_GOOGLE_DRIVE_UX.md` - Drive UX improvements

#### Troubleshooting (`troubleshooting/`)
- `BUGFIXES.md` - Known bugs and fixes
- `WORKFLOW_FIXES_COMPLETE.md` - Workflow issue resolutions
- `debug-users.html` - User management debugging tool

## ✨ Key Features

### Multi-User Collaboration
- **Real-time sync** via Firebase across all locations
- **Multi-assignee tasks** - Assign tasks to entire teams
- **Task-level chat** - Discuss tasks across all apps
- **Activity logging** - Track all actions and updates

### Access Levels
- **Admin** (PIN 0000) → Full hub access
- **Manager** → Project oversight and task management
- **Worker** → Task execution and progress updates

### Google Drive Integration
- **One-time setup** - Only admin connects Drive
- **Team root folder** - Shared project folders
- **Automatic folder creation** - Project/area structure
- **Report uploads** - Progress photos and documents

### Task Management
- **Hierarchical tasks** - WBS structure with subtasks
- **Kanban board** - Visual task status tracking
- **Priority levels** - High, medium, low
- **Time tracking** - Clock in/out and hours worked
- **Status tracking** - Todo, In Progress, Done

### Real-Time Features
- **Firebase sync** - Cross-location updates (1-3s)
- **BroadcastChannel** - Same-browser instant sync
- **Notifications** - Toast alerts for updates
- **Activity feed** - Live activity stream

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Add your config to `index.html`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ... etc
};
```

### Google Drive Setup
1. Create project at https://console.cloud.google.com
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add your credentials to files:
```javascript
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
```

### Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pmSystem/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 👥 User Management

### Adding Users
1. Login as admin (PIN 0000)
2. Navigate to Team tab
3. Click "Add Team Member"
4. Fill in details:
   - Name, Email, Job Title
   - Access Level (Worker/Manager/Admin)
   - Generate 4-digit PIN
5. Share PIN with team member

### User Login
1. Open `index.html`
2. Enter assigned 4-digit PIN
3. Automatically routed to correct app

## 📝 Common Workflows

### Admin: Create Project
1. Login → Projects tab → Add Project
2. Enter name, select client, assign lead
3. Add areas (billable sections)
4. Add tasks with WBS structure
5. Assign team members (multiple allowed)

### Manager: Oversee Projects
1. Login → Select project
2. View task progress
3. Edit/reassign tasks
4. Chat with workers on tasks
5. Monitor activity feed

### Worker: Complete Tasks
1. Login → Select project
2. View assigned tasks
3. Start task → Clock in
4. Upload progress photos/reports
5. Mark complete → Clock out

## 🌍 Multi-Location Usage

### Setup for Multiple Locations
- Admin in Location A sets up Firebase + Drive
- Team members in Location B use PINs to login
- All changes sync via Firebase (1-3 second delay)
- No VPN or special network config needed

### Expected Behavior
- **Same browser/device**: Instant sync via BroadcastChannel
- **Different browsers/devices**: 1-3 second sync via Firebase
- **Different countries**: 1-3 second sync (same as different browsers)

## 🔒 Security Notes

- PINs are stored in hubState (not encrypted)
- OAuth is for development only
- For production, implement proper authentication
- Firestore rules above allow open access (not production-ready)

## 🐛 Troubleshooting

### Tasks Not Syncing
1. Check Firebase indicator (top right)
2. Open browser console for errors
3. Verify Firestore rules allow read/write
4. Check `DOCUMENTATION/troubleshooting/` folder

### Google Drive Not Connecting
1. Only admin needs to connect
2. Check OAuth consent screen setup
3. Verify redirect URIs in Google Console
4. See `DOCUMENTATION/setup-guides/GOOGLE_DRIVE_MULTI_USER_FAQ.md`

### User Can't Login
1. Check PIN exists in Team tab
2. Verify user has correct Access Level
3. Try admin PIN (0000) to access hub
4. Use `DOCUMENTATION/troubleshooting/debug-users.html`

## 📚 Additional Resources

- **Setup Guides**: See `DOCUMENTATION/setup-guides/`
- **Health Reports**: See `DOCUMENTATION/health-reports/`
- **Implementation Notes**: See `DOCUMENTATION/implementation-notes/`
- **Troubleshooting**: See `DOCUMENTATION/troubleshooting/`

## 🚧 Development Status

**Current Version**: v01.024

**Recent Updates**:
- ✅ Multi-assignee tasks (multiple workers per task)
- ✅ Task-level chat across all apps
- ✅ Firebase real-time sync (primary source of truth)
- ✅ Activity logging and notifications
- ✅ Google Drive folder synchronization
- ✅ Access level management in all apps

## 📞 Support

For issues, questions, or feature requests:
1. Check `DOCUMENTATION/` folders
2. Review troubleshooting guides
3. Check browser console for errors
4. Verify Firebase and Drive configurations

---

**Built with**: JavaScript, Firebase Firestore, Google Drive API, BroadcastChannel API
