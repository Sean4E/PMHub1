/**
 * PM Hub Unified Sync Library
 * Provides consistent Firebase write operations for Hub, Manager, and Worker
 *
 * Usage:
 *   const sync = new PMHubSync(appName, currentUser);
 *   await sync.saveState(hubState, section);
 */

class PMHubSync {
    constructor(appName, currentUser) {
        this.appName = appName || 'Unknown';
        this.currentUser = currentUser;

        console.log(`✓ PMHubSync initialized for ${this.appName}`);
    }

    /**
     * Save complete state to Firebase (IMMEDIATE write, no debounce)
     * @param {Object} state - The complete hub state object
     * @param {string} section - Section being updated (for logging only)
     * @returns {Promise<boolean>} Success status
     */
    /**
     * Assign WBS numbers to tasks (must match Hub's assignWbsToTasks logic)
     */
    assignWbsToTasks(tasks, parentWbs = '') {
        tasks.forEach((task, index) => {
            const wbs = parentWbs ? `${parentWbs}.${index + 1}` : `${index + 1}`;
            task.wbs = wbs;

            if (task.children && task.children.length > 0) {
                this.assignWbsToTasks(task.children, wbs);
            }
        });
    }

    async saveState(state, section = 'general', activity = null) {
        if (!window.firebaseEnabled || !window.db || !window.firestore) {
            console.log(`ℹ️ ${this.appName}: Firebase not available`);
            return { success: false };
        }

        try {
            console.log(`🔥 ${this.appName}: Writing to Firebase immediately (section: ${section})`);

            // CRITICAL: Assign WBS to all tasks in all areas before saving
            if (state.projects) {
                state.projects.forEach(project => {
                    if (project.areas) {
                        project.areas.forEach(area => {
                            if (area.tasks && area.tasks.length > 0) {
                                this.assignWbsToTasks(area.tasks);
                            }
                        });
                    }
                });
            }

            // Prepare clean state for Firebase - ALL shared data
            const stateToSync = {
                // Core data (synced globally)
                projects: Array.isArray(state.projects) ? state.projects : [],
                ourTeam: Array.isArray(state.ourTeam) ? state.ourTeam : [],
                clientTeam: Array.isArray(state.clientTeam) ? state.clientTeam : [],
                clients: Array.isArray(state.clients) ? state.clients : [],
                tools: Array.isArray(state.tools) ? state.tools : [],

                // Activity & Logging (synced globally)
                activities: Array.isArray(state.activities) ? state.activities : [],
                activityLog: Array.isArray(state.activityLog) ? state.activityLog : [],

                // Reports & Time Tracking (synced globally)
                reports: Array.isArray(state.reports) ? state.reports : [],
                timeEntries: Array.isArray(state.timeEntries) ? state.timeEntries : [],

                // Notifications (synced globally)
                notifications: Array.isArray(state.notifications) ? state.notifications : [],

                // Project Management
                usedProjectNumbers: Array.isArray(state.usedProjectNumbers) ? state.usedProjectNumbers : [],

                // Configuration (synced globally)
                folderTemplate: Array.isArray(state.folderTemplate) ? state.folderTemplate : [],
                settings: state.settings || {},
                modules: state.modules || {},
                calendarFilters: state.calendarFilters || { type: 'all', project: 'all' },

                // Metadata
                lastModified: new Date().toISOString(),
                lastSyncedBy: this.currentUser?.name || this.appName
            };

            // CRITICAL: Use setDoc WITHOUT merge option (full replacement)
            // This ensures all apps have identical state
            const docRef = window.firestore.doc(window.db, 'hubs', 'main');
            await window.firestore.setDoc(docRef, stateToSync);

            console.log(`✅ ${this.appName}: Firebase write complete`);

            // If activity provided, extract the latest one for notification
            let latestActivity = activity;
            if (!latestActivity && stateToSync.activityLog && stateToSync.activityLog.length > 0) {
                latestActivity = stateToSync.activityLog[stateToSync.activityLog.length - 1];
            }

            return {
                success: true,
                activity: latestActivity,
                section: section
            };

        } catch (error) {
            console.error(`❌ ${this.appName}: Firebase write failed:`, error);
            return { success: false };
        }
    }

    /**
     * Log activity to Firebase (appends to activityLog array)
     * @param {string} type - Activity type (e.g., 'AREA_CREATED')
     * @param {string} message - Activity message
     * @param {Object} data - Additional activity data
     */
    async logActivity(type, message, data = {}) {
        if (!window.firebaseEnabled || !window.db || !window.firestore) {
            console.log(`ℹ️ ${this.appName}: Firebase not available for activity logging`);
            return;
        }

        try {
            const docRef = window.firestore.doc(window.db, 'hubs', 'main');
            const docSnap = await window.firestore.getDoc(docRef);

            if (docSnap.exists()) {
                const hubState = docSnap.data();

                if (!hubState.activityLog) hubState.activityLog = [];

                hubState.activityLog.push({
                    id: Date.now().toString(),
                    type: type,
                    message: message,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser?.id || this.appName.toLowerCase(),
                    userName: this.currentUser?.name || this.appName,
                    data: data,
                    source: this.appName.toLowerCase()
                });

                // Keep only last 500 activities
                if (hubState.activityLog.length > 500) {
                    hubState.activityLog = hubState.activityLog.slice(-500);
                }

                // Update lastModified
                hubState.lastModified = new Date().toISOString();
                hubState.lastSyncedBy = this.currentUser?.name || this.appName;

                // Write back to Firebase
                await window.firestore.setDoc(docRef, hubState);

                console.log(`✅ ${this.appName}: Activity logged to Firebase`);
            }
        } catch (error) {
            console.error(`❌ ${this.appName}: Failed to log activity:`, error);
        }
    }

    /**
     * Get current state from Firebase
     * @returns {Promise<Object|null>} Hub state or null if failed
     */
    async getState() {
        if (!window.firebaseEnabled || !window.db || !window.firestore) {
            return null;
        }

        try {
            const docRef = window.firestore.doc(window.db, 'hubs', 'main');
            const docSnap = await window.firestore.getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error(`❌ ${this.appName}: Failed to get state:`, error);
            return null;
        }
    }
}

// Make available globally
window.PMHubSync = PMHubSync;
