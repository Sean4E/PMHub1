# PM Hub Real-Time Architecture

## Current Architecture (The Problem)

```
Worker/Manager → localStorage → Hub reads → Hub writes to Firebase → Firebase onSnapshot → All apps
                    ↓
              BroadcastChannel (same browser only)
```

**Issues:**
- Worker/Manager changes go through localStorage bottleneck
- Hub must be open to sync to Firebase
- Not truly real-time - depends on Hub being active
- BroadcastChannel only works in same browser

## New Architecture (The Solution)

```
All Apps (Hub/Manager/Worker) → Firebase directly → Firebase onSnapshot → All Apps update
                                        ↓
                                  localStorage (backup/cache only)
```

**Benefits:**
- ✅ True real-time sync across ALL devices and browsers
- ✅ No dependency on Hub being open
- ✅ Worker starts task → instantly visible in Manager/Hub
- ✅ Hub creates task → instantly available to Worker
- ✅ Status changes reflect immediately everywhere
- ✅ localStorage becomes offline cache, not bottleneck

## Implementation Strategy

### Phase 1: Worker Direct Firebase Writes
**Functions to modify:**
1. `clockIn()` - Write time entry directly to Firebase
2. `startSelectedTask()` - Update task status in Firebase
3. `completeCurrentTask()` - Mark task complete in Firebase
4. `stopCurrentTask()` - Update task status in Firebase
5. `submitPhotoReport()` - Write report to Firebase

**Pattern:**
```javascript
async function startSelectedTask() {
    // 1. Update local state
    task.status = 'progress';
    task.startedAt = new Date().toISOString();
    task.startedBy = currentUser.name;

    // 2. Write directly to Firebase
    const projectRef = window.firestore.doc(window.db, 'hubs', 'main');
    const hubDoc = await window.firestore.getDoc(projectRef);
    const hubData = hubDoc.data();

    // Update the specific task in Firebase data
    const project = hubData.projects.find(p => p.id == currentTask.projectId);
    const area = project.areas.find(a => a.id == currentTask.areaId);
    const firebaseTask = area.tasks.find(t => t.wbs == task.wbs);

    firebaseTask.status = 'progress';
    firebaseTask.startedAt = task.startedAt;
    firebaseTask.startedBy = task.startedBy;

    // Write back to Firebase
    await window.firestore.setDoc(projectRef, {
        ...hubData,
        lastModified: new Date().toISOString(),
        lastSyncedBy: currentUser.name
    });

    // 3. Update localStorage as backup
    localStorage.setItem('pmSystemState', JSON.stringify(hubData));

    // 4. No BroadcastChannel needed - Firebase listeners handle sync
    console.log('✓ Task started and synced to Firebase in real-time');
}
```

### Phase 2: Manager Direct Firebase Writes
**Functions to modify:**
1. Task assignment changes
2. Priority updates
3. Area status changes
4. Calendar event creation

### Phase 3: Enhanced Firebase Listeners
**Already implemented in `pm-hub-realtime.js`:**
- Firebase onSnapshot on `/hubs/main`
- Automatic state updates when Firebase changes
- Beautiful toast notifications

**What works:**
- Hub → Firebase → Manager/Worker ✅
- Chat system (fully real-time) ✅

**What we're adding:**
- Worker → Firebase → Hub/Manager ✅ (implementing now)
- Manager → Firebase → Hub/Worker ✅ (implementing now)

### Phase 4: Offline Support
**localStorage strategy:**
```javascript
// Queue operations when offline
if (!navigator.onLine) {
    offlineQueue.push({
        operation: 'updateTask',
        data: taskUpdate,
        timestamp: Date.now()
    });
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    return;
}

// Process queue when back online
window.addEventListener('online', async () => {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    for (const operation of queue) {
        await processOperation(operation);
    }
    localStorage.removeItem('offlineQueue');
});
```

## Real-Time Scenarios

### Scenario 1: Worker Starts Task
```
Worker clicks "Start Task"
    ↓
Worker updates local task object
    ↓
Worker writes to Firebase: /hubs/main
    ↓
Firebase onSnapshot fires in Hub & Manager (< 100ms)
    ↓
Hub & Manager see task status change to "progress"
    ↓
UI updates automatically with toast notification
```

### Scenario 2: Hub Creates New Task
```
Hub creates task in project
    ↓
Hub writes to Firebase: /hubs/main
    ↓
Firebase onSnapshot fires in Worker & Manager
    ↓
Worker's task list refreshes automatically
    ↓
Worker can select and start new task immediately
```

### Scenario 3: Manager Updates Priority
```
Manager changes task priority
    ↓
Manager writes to Firebase: /hubs/main
    ↓
Firebase onSnapshot fires in Hub & Worker
    ↓
Worker sees priority change in active task
    ↓
Hub sees updated priority in project view
```

## Migration Plan

1. ✅ Keep existing localStorage saves as backup
2. ✅ Add Firebase direct writes to Worker functions
3. ✅ Add Firebase direct writes to Manager functions
4. ✅ Test each function individually
5. ✅ Verify real-time updates across all apps
6. ✅ Test offline scenario (localStorage queue)
7. ✅ Remove old polling/broadcast code (optional cleanup)

## Testing Checklist

- [ ] Worker starts task → Hub/Manager see it instantly
- [ ] Hub creates task → Worker can start it instantly
- [ ] Manager updates task → Hub/Worker see change instantly
- [ ] Task completion syncs in real-time
- [ ] Photo reports appear instantly
- [ ] Time entries sync immediately
- [ ] Works across different browsers
- [ ] Works across different devices
- [ ] Offline queue works when network drops
- [ ] No duplicate updates or race conditions
