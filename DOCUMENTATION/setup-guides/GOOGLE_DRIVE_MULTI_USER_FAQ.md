# Google Drive Multi-User Setup FAQ

## Visual Update

The Google Drive account indicator now appears as a **full-width bar below the header** instead of in the header itself. This gives you full access to all header buttons while clearly showing which Drive account is connected.

**Location**: Blue bar immediately below the main header
**Shows**: 📁 Google Drive: your-email@gmail.com

---

## Do Both Users Need to Sign Into Google?

**Short Answer**: No! You have multiple options.

### Option 1: Single Shared Account (RECOMMENDED) ⭐

**Setup:**
- Only ONE person connects Google Drive on login screen
- That person's Drive stores all folders
- Other users DON'T need to connect Google Drive at all

**How It Works:**
1. **User 1 (Ireland)**: Connects Google Drive at login → Folders created in their Drive
2. **User 2 (New York)**: Logs in WITHOUT connecting Google Drive
3. Both users work on same Firebase hub
4. Folder IDs are stored in Firebase
5. User 1 uploads files (they have Drive access)
6. User 2 can see all data in Firebase, but can't upload to Drive

**Pros:**
✅ Simple setup
✅ One Drive to manage
✅ Clear ownership
✅ No permission issues

**Cons:**
❌ Only one person can upload files to Drive
❌ Other users read-only for Drive features

**Best For:** Small teams where one person manages files

---

### Option 2: Multiple People Connect Same Account

**Setup:**
- Create dedicated Google account (e.g., pmhub@company.com)
- ALL users connect with THIS account at login

**How It Works:**
1. **User 1**: Connects with pmhub@company.com
2. **User 2**: Connects with pmhub@company.com
3. Both see: "📁 Google Drive: pmhub@company.com"
4. All folders in one Drive
5. Both can upload files

**Pros:**
✅ All users can upload to Drive
✅ Shared folder ownership
✅ Simple permissions
✅ Full collaboration

**Cons:**
⚠️ Shared credentials (less secure)
⚠️ No individual accountability for file uploads

**Best For:** Small trusted teams (2-5 people)

---

### Option 3: Individual Accounts with Folder Sharing

**Setup:**
- Each user connects with their own Google account
- One person creates folders first
- Folders are shared with other users

**How It Works:**
1. **User 1 (Project Lead)**:
   - Connects with john@company.com
   - Creates first project
   - Folders created in John's Drive
   - Shares "4E PM Systems Hub Pro" folder with sarah@company.com (Editor access)

2. **User 2 (Colleague)**:
   - Connects with sarah@company.com
   - Can now upload to shared folders
   - Both see different email addresses in Drive indicator

**Pros:**
✅ Individual Google accounts
✅ Better security and audit trail
✅ Each person's credentials
✅ Can see who uploaded what

**Cons:**
❌ More complex setup
❌ Must remember to share folders
❌ Permission management needed
❌ Can be confusing which Drive owns folders

**Best For:** Larger teams or enterprise setups

---

## Firebase vs Google Drive - What's the Difference?

### Firebase (Database) 🔥
**What It Stores:**
- Projects, tasks, areas
- Team members, clients
- Activity log
- Time entries
- Reports metadata
- Folder IDs (references to Drive)
- Chat messages

**Who Needs It:**
- **EVERYONE** - All users must be connected to Firebase
- Firebase is the single source of truth
- No Google account needed for Firebase

**How to Connect:**
- Login screen → Click "Connect" next to Firebase
- Automatic, no credentials needed
- Uses project configuration already in code

### Google Drive (File Storage) 📁
**What It Stores:**
- Report photos/files
- Project documents
- Uploaded media
- Calendar events (Google Calendar)

**Who Needs It:**
- **OPTIONAL** - Only users who need to upload files
- Read-only users can see data without Drive
- One person connecting is enough for basic use

**How to Connect:**
- Login screen → Click "Connect" next to Google Drive
- Requires Google account login
- OAuth authentication

---

## Recommended Setup by Team Size

### 2-3 Users (Small Team)
**Best Approach:** Option 2 - Shared Google Account

**Setup Steps:**
1. Create pmhub@yourcompany.com Google account
2. All users connect Firebase at login
3. All users connect Google Drive with pmhub@yourcompany.com
4. Everyone can upload, full collaboration

**Calendar:** Everyone sees and edits same calendar

---

### 4-10 Users (Medium Team)
**Best Approach:** Option 1 - Single Admin with Drive

**Setup Steps:**
1. ONE admin user connects Google Drive
2. Admin creates all projects and manages files
3. All other users connect Firebase only
4. Workers/managers see data, can't upload to Drive

**Calendar:** Admin manages, others view via shared calendar link

**Alternative:** Use Option 3 with folder sharing if multiple people need to upload

---

### 10+ Users (Large Team)
**Best Approach:** Option 3 - Individual Accounts with Sharing

**Setup Steps:**
1. Admin creates dedicated Google Drive folder structure
2. Shares folders with specific team members
3. Each user connects with their own Google account
4. Permission management via Google Drive
5. Consider Google Workspace for better management

**Calendar:** Use Google Workspace shared calendars

---

## How Calendar Events Work

### Single Google Account (Options 1 & 2)
**Calendar Ownership:**
- Events stored in ONE Google Calendar
- The calendar belongs to the connected account

**All Users See:**
- Same events
- Same calendar
- Real-time updates

**Who Can Edit:**
- Anyone with the Google account credentials
- If using shared account (Option 2), everyone can edit

**Best Practice:**
- Use Option 2 (shared account) so everyone can add events
- Or use Option 1 and share calendar link for view-only

---

### Individual Accounts (Option 3)
**Calendar Ownership:**
- Each user has their own Google Calendar
- Hub shows the calendar of whoever is currently connected

**Problem:**
- User 1 sees their calendar
- User 2 sees their calendar
- No shared calendar view

**Solution:**
1. Create a shared team calendar in Google Calendar
2. Share it with all team members
3. Hub can display shared calendar if properly configured
4. Alternative: Use Google Workspace

**Note:** Current implementation shows personal calendar only. For true multi-user calendar, would need additional development.

---

## What Happens When Only One Person Connects Drive

### Scenario: User 1 Connects, User 2 Doesn't

**Firebase (Shared by All):**
- ✅ Both users see all projects
- ✅ Both users see all tasks
- ✅ Both users see activity log
- ✅ Both users see report metadata
- ✅ Real-time sync works perfectly

**Google Drive (Only User 1 has access):**
- ✅ User 1 can upload report photos
- ✅ User 1 can create project folders
- ❌ User 2 cannot upload to Drive
- ⚠️ User 2 can see Drive folder links (if stored in Firebase)
- ⚠️ User 2 sees "Connect Google" button

**Calendar:**
- ✅ User 1 sees their calendar
- ❌ User 2 sees no calendar (unless they connect their own)

**What User 2 CAN Do (Without Drive):**
- ✅ Create projects (no Drive folders created)
- ✅ Create tasks, areas
- ✅ Mark tasks complete
- ✅ Log time
- ✅ View all reports
- ✅ Chat with team
- ✅ View activity log
- ❌ Upload report photos
- ❌ View calendar

**What User 2 CANNOT Do:**
- ❌ Upload files to Google Drive
- ❌ Create Drive folders
- ❌ Upload report photos with media
- ❌ Use calendar features

---

## Recommended Workflow

### For Maximum Collaboration (2-5 users):

1. **At Login Screen (Everyone):**
   - ✅ Connect Firebase
   - ✅ Connect Google Drive with shared account

2. **In PM Hub:**
   - Everyone creates projects
   - Everyone uploads reports
   - Everyone uses calendar
   - One hub, full collaboration

3. **Drive Account Indicator:**
   - All users see same email
   - Confirms shared setup

---

### For Admin + Workers (5+ users):

1. **At Login Screen:**
   - **Admin**: Connect Firebase + Google Drive
   - **Workers/Managers**: Connect Firebase ONLY

2. **In PM Hub:**
   - **Admin**: Creates projects with Drive folders
   - **Workers**: Work on tasks, mark complete
   - **Workers**: Create reports without media (or admin uploads for them)
   - **Managers**: Monitor progress, review work

3. **Drive Account Indicator:**
   - Admin sees their email
   - Workers see "Connect Google" button (but don't need to)

4. **Folder IDs:**
   - Stored in Firebase
   - All users can see folder links
   - Click links to view Drive folders (if they have permissions)

---

## Technical Details

### How Folder IDs Work

1. **When Project Created:**
   ```javascript
   // User with Drive connected creates project
   project.driveFolderId = "1abc123xyz..."

   // Saved to Firebase
   await firebase.setDoc('hubs/main', { projects: [...] })
   ```

2. **Other Users Load:**
   ```javascript
   // Load from Firebase
   const projects = firebase.getData()

   // project.driveFolderId is available to all users
   // But only users with Drive access can upload
   ```

3. **Folder Links:**
   - All users see: `https://drive.google.com/drive/folders/1abc123xyz...`
   - Click to open in browser
   - Google Drive permissions control who can view/edit

---

## Security Considerations

### Shared Account Approach:
- **Risk**: One person's actions appear as another
- **Mitigation**: PM Hub tracks user actions separately in activity log
- **Best For**: Small, trusted teams

### Individual Account Approach:
- **Risk**: Complex permission management
- **Mitigation**: Google Drive's built-in permissions
- **Best For**: Larger teams, enterprises

### Firebase Security:
- All users access same Firebase database
- User actions tracked by PM Hub login (PIN)
- Activity log shows who did what
- Firebase permissions configured in Firebase Console

---

## Summary Table

| Feature | All Connect Drive | One Connects Drive | Each Own Account |
|---------|------------------|-------------------|------------------|
| **Setup Complexity** | Simple | Simplest | Complex |
| **File Upload** | Everyone | One person | Everyone (with sharing) |
| **Calendar** | Shared | One calendar | Multiple calendars |
| **Folder Management** | Anyone | One person | Permission-based |
| **Security** | Shared credentials | Single point | Individual credentials |
| **Best For** | 2-5 users | 1 admin + workers | Large teams |
| **Activity Tracking** | By PM PIN | By PM PIN | By PM PIN + Google |

---

## Recommendation

**For your Ireland + New York setup:**

**OPTION 2: Both Connect with Shared Google Account**

**Why:**
1. ✅ Both can upload report photos
2. ✅ Both can create project folders
3. ✅ Both see same calendar
4. ✅ Simple to maintain
5. ✅ Full collaboration
6. ✅ Drive indicator shows same email = confirmation

**Setup:**
1. Create pmhub@yourcompany.com (or use existing shared account)
2. Both users: Login screen → Connect Google → Sign in with pmhub@yourcompany.com
3. Both users: See "📁 Google Drive: pmhub@yourcompany.com" below header
4. Both users: Full access to all features

**Your Firebase is already working perfectly for real-time sync - this just adds Google Drive collaboration!**
