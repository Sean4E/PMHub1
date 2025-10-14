/**
 * PM Hub Firebase Operations
 *
 * Provides direct Firebase read/write operations for real-time sync
 * Used by Hub, Manager, and Worker for immediate data synchronization
 */

class PMHubFirebase {
    constructor(options = {}) {
        this.db = options.db || window.db;
        this.firestore = options.firestore || window.firestore;
        this.currentUser = options.currentUser;
        this.hubDocPath = 'hubs/main';

        // Cache for reducing Firebase reads
        this.stateCache = null;
        this.lastFetchTime = 0;
        this.cacheDuration = 1000; // 1 second cache
    }

    /**
     * Get current hub state from Firebase
     * Uses short-term cache to reduce reads
     */
    async getHubState(forceRefresh = false) {
        const now = Date.now();

        if (!forceRefresh && this.stateCache && (now - this.lastFetchTime) < this.cacheDuration) {
            console.log('📦 Using cached hub state');
            return this.stateCache;
        }

        try {
            const docRef = this.firestore.doc(this.db, this.hubDocPath);
            const docSnap = await this.firestore.getDoc(docRef);

            if (docSnap.exists()) {
                this.stateCache = docSnap.data();
                this.lastFetchTime = now;
                console.log('☁️ Hub state fetched from Firebase');
                return this.stateCache;
            } else {
                console.error('❌ Hub document does not exist in Firebase');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to fetch hub state:', error);
            return null;
        }
    }

    /**
     * Update task in Firebase
     * @param {string} projectId
     * @param {string} areaId
     * @param {string} taskWbs
     * @param {object} taskUpdates - Properties to update
     * @param {string} activityType - For logging (e.g., 'TASK_START', 'TASK_COMPLETE')
     * @param {string} activityMessage - For logging
     */
    async updateTask(projectId, areaId, taskWbs, taskUpdates, activityType = null, activityMessage = null) {
        console.log('🔄 Updating task in Firebase:', { projectId, areaId, taskWbs, taskUpdates });

        try {
            // Get current state
            const hubState = await this.getHubState(true); // Force refresh
            if (!hubState) {
                throw new Error('Failed to fetch hub state');
            }

            // Find and update the task
            const project = hubState.projects?.find(p => p.id == projectId);
            if (!project) {
                throw new Error(`Project not found: ${projectId}`);
            }

            const area = project.areas?.find(a => a.id == areaId);
            if (!area) {
                throw new Error(`Area not found: ${areaId}`);
            }

            const task = area.tasks?.find(t => t.wbs == taskWbs);
            if (!task) {
                throw new Error(`Task not found: ${taskWbs}`);
            }

            // Apply updates
            Object.assign(task, taskUpdates);

            // Add activity if provided
            if (activityType && activityMessage) {
                if (!hubState.activityLog) hubState.activityLog = [];
                hubState.activityLog.push({
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    type: activityType,
                    message: activityMessage,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name
                });
            }

            // Write to Firebase
            const docRef = this.firestore.doc(this.db, this.hubDocPath);
            await this.firestore.setDoc(docRef, {
                ...hubState,
                lastModified: new Date().toISOString(),
                lastSyncedBy: this.currentUser?.name || 'Unknown'
            });

            // Update cache
            this.stateCache = hubState;
            this.lastFetchTime = Date.now();

            // Update localStorage as backup
            localStorage.setItem('pmSystemState', JSON.stringify(hubState));

            console.log('✅ Task updated in Firebase successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to update task in Firebase:', error);
            return false;
        }
    }

    /**
     * Add time entry in Firebase
     * @param {object} timeEntry
     */
    async addTimeEntry(timeEntry) {
        console.log('⏰ Adding time entry to Firebase:', timeEntry);

        try {
            const hubState = await this.getHubState(true);
            if (!hubState) {
                throw new Error('Failed to fetch hub state');
            }

            if (!hubState.timeEntries) hubState.timeEntries = [];
            hubState.timeEntries.push(timeEntry);

            const docRef = this.firestore.doc(this.db, this.hubDocPath);
            await this.firestore.setDoc(docRef, {
                ...hubState,
                lastModified: new Date().toISOString(),
                lastSyncedBy: this.currentUser?.name || 'Unknown'
            });

            this.stateCache = hubState;
            this.lastFetchTime = Date.now();
            localStorage.setItem('pmSystemState', JSON.stringify(hubState));

            console.log('✅ Time entry added to Firebase successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to add time entry:', error);
            return false;
        }
    }

    /**
     * Add photo report in Firebase
     * @param {object} report
     */
    async addPhotoReport(report) {
        console.log('📸 Adding photo report to Firebase');

        try {
            const hubState = await this.getHubState(true);
            if (!hubState) {
                throw new Error('Failed to fetch hub state');
            }

            if (!hubState.photoReports) hubState.photoReports = [];
            hubState.photoReports.push(report);

            // Add activity log
            if (!hubState.activityLog) hubState.activityLog = [];
            hubState.activityLog.push({
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                type: 'REPORT',
                message: `Photo report: ${report.taskName || 'General'}`,
                userId: this.currentUser?.id,
                userName: this.currentUser?.name,
                data: { reportId: report.id }
            });

            const docRef = this.firestore.doc(this.db, this.hubDocPath);
            await this.firestore.setDoc(docRef, {
                ...hubState,
                lastModified: new Date().toISOString(),
                lastSyncedBy: this.currentUser?.name || 'Unknown'
            });

            this.stateCache = hubState;
            this.lastFetchTime = Date.now();
            localStorage.setItem('pmSystemState', JSON.stringify(hubState));

            console.log('✅ Photo report added to Firebase successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to add photo report:', error);
            return false;
        }
    }

    /**
     * Add activity log entry
     * @param {string} type
     * @param {string} message
     * @param {object} data
     */
    async logActivity(type, message, data = null) {
        try {
            const hubState = await this.getHubState(true);
            if (!hubState) return false;

            if (!hubState.activityLog) hubState.activityLog = [];
            hubState.activityLog.push({
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                type: type,
                message: message,
                userId: this.currentUser?.id,
                userName: this.currentUser?.name,
                data: data
            });

            const docRef = this.firestore.doc(this.db, this.hubDocPath);
            await this.firestore.setDoc(docRef, {
                ...hubState,
                lastModified: new Date().toISOString(),
                lastSyncedBy: this.currentUser?.name || 'Unknown'
            });

            this.stateCache = hubState;
            this.lastFetchTime = Date.now();
            localStorage.setItem('pmSystemState', JSON.stringify(hubState));

            return true;
        } catch (error) {
            console.error('❌ Failed to log activity:', error);
            return false;
        }
    }

    /**
     * Clear cache to force fresh Firebase read
     */
    clearCache() {
        this.stateCache = null;
        this.lastFetchTime = 0;
        console.log('🗑️ Firebase cache cleared');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMHubFirebase;
}
