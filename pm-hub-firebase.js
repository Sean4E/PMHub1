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
        console.log('═══════════════════════════════════════');
        console.log('🔄 FIREBASE: Updating task');
        console.log('═══════════════════════════════════════');
        console.log('  Project ID:', projectId);
        console.log('  Area ID:', areaId);
        console.log('  Task WBS:', taskWbs);
        console.log('  Updates:', taskUpdates);
        console.log('  Activity:', activityType, '-', activityMessage);

        try {
            // Get current state
            console.log('📥 Fetching hub state from Firebase...');
            const hubState = await this.getHubState(true); // Force refresh
            if (!hubState) {
                throw new Error('Failed to fetch hub state');
            }
            console.log('✓ Hub state fetched');

            // Find project
            console.log('🔍 Looking for project:', projectId);
            const project = hubState.projects?.find(p => p.id === projectId);
            if (!project) {
                console.error('❌ Project not found!');
                console.error('Available projects:', hubState.projects?.map(p => ({ id: p.id, name: p.name })));
                throw new Error(`Project not found: ${projectId}`);
            }
            console.log('✓ Project found:', project.name);

            // Find area
            console.log('🔍 Looking for area:', areaId);
            const area = project.areas?.find(a => a.id === areaId);
            if (!area) {
                console.error('❌ Area not found!');
                console.error('Available areas:', project.areas?.map(a => ({ id: a.id, name: a.name })));
                throw new Error(`Area not found: ${areaId}`);
            }
            console.log('✓ Area found:', area.name);

            // Find task
            console.log('🔍 Looking for task:', taskWbs);
            const task = area.tasks?.find(t => t.wbs === taskWbs);
            if (!task) {
                console.error('❌ Task not found!');
                console.error('Available tasks:', area.tasks?.map(t => ({ wbs: t.wbs, name: t.name })));
                throw new Error(`Task not found: ${taskWbs}`);
            }
            console.log('✓ Task found:', task.name);

            // Apply updates
            console.log('📝 Applying updates to task...');
            Object.assign(task, taskUpdates);
            console.log('✓ Task updated:', task);

            // Add activity if provided
            let activityData = null;
            if (activityType && activityMessage) {
                console.log('📋 Adding activity log entry...');
                if (!hubState.activityLog) hubState.activityLog = [];

                activityData = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    type: activityType,
                    message: activityMessage,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    source: 'worker',
                    projectId: projectId,
                    projectName: project.name,
                    data: {
                        projectId,
                        areaId,
                        areaName: area.name,
                        taskWbs,
                        taskName: task.name,
                        updates: taskUpdates
                    }
                };

                hubState.activityLog.push(activityData);
                console.log('✓ Activity logged');
            }

            // Write to Firebase using PMHubSync (ensures WBS assignment)
            console.log('☁️ Writing to Firebase via PMHubSync...');
            if (window.PMHubSync) {
                const sync = new PMHubSync('Worker', this.currentUser);
                const result = await sync.saveState(hubState, 'task-update', activityData);
                console.log('✓ Firebase write successful via PMHubSync');

                // Update cache
                this.stateCache = hubState;
                this.lastFetchTime = Date.now();

                // Update localStorage as backup
                localStorage.setItem('pmSystemState', JSON.stringify(hubState));
                console.log('✓ localStorage updated');

                console.log('═══════════════════════════════════════');
                console.log('✅ TASK UPDATE COMPLETE');
                console.log('═══════════════════════════════════════');

                // Return success with activity for notifications
                return true;
            } else {
                // Fallback to direct write (not recommended)
                console.warn('⚠️ PMHubSync not available, using direct write');
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

                return true;
            }

        } catch (error) {
            console.log('═══════════════════════════════════════');
            console.error('❌ FAILED TO UPDATE TASK');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.log('═══════════════════════════════════════');
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

            // Write using PMHubSync
            if (window.PMHubSync) {
                const sync = new PMHubSync('FirebaseOps', this.currentUser);
                await sync.saveState(hubState, 'time-entry');
            } else {
                // Fallback
                const docRef = this.firestore.doc(this.db, this.hubDocPath);
                await this.firestore.setDoc(docRef, {
                    ...hubState,
                    lastModified: new Date().toISOString(),
                    lastSyncedBy: this.currentUser?.name || 'Unknown'
                });
            }

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
            const activityData = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                type: 'REPORT',
                message: `Uploaded ${report.photoCount || 0} photos: ${report.taskName || 'General'}`,
                userId: this.currentUser?.id,
                userName: this.currentUser?.name,
                source: 'worker',
                projectId: report.projectId,
                projectName: report.projectName,
                data: {
                    reportId: report.id,
                    taskName: report.taskName,
                    photoCount: report.photoCount,
                    reportsFolderId: report.reportsFolderId
                }
            };
            hubState.activityLog.push(activityData);

            // Write using PMHubSync with activity
            if (window.PMHubSync) {
                const sync = new PMHubSync('Worker', this.currentUser);
                await sync.saveState(hubState, 'photo-report', activityData);
            } else {
                // Fallback
                const docRef = this.firestore.doc(this.db, this.hubDocPath);
                await this.firestore.setDoc(docRef, {
                    ...hubState,
                    lastModified: new Date().toISOString(),
                    lastSyncedBy: this.currentUser?.name || 'Unknown'
                });
            }

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
            const activityData = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                type: type,
                message: message,
                userId: this.currentUser?.id,
                userName: this.currentUser?.name,
                source: 'worker',
                projectId: data?.projectId,
                projectName: data?.projectName,
                data: data
            };
            hubState.activityLog.push(activityData);

            // Write using PMHubSync with activity for notifications
            if (window.PMHubSync) {
                const sync = new PMHubSync('Worker', this.currentUser);
                await sync.saveState(hubState, 'activity-log', activityData);
            } else {
                // Fallback
                const docRef = this.firestore.doc(this.db, this.hubDocPath);
                await this.firestore.setDoc(docRef, {
                    ...hubState,
                    lastModified: new Date().toISOString(),
                    lastSyncedBy: this.currentUser?.name || 'Unknown'
                });
            }

            this.stateCache = hubState;
            this.lastFetchTime = Date.now();
            localStorage.setItem('pmSystemState', JSON.stringify(hubState));

            console.log(`✅ Activity logged to Firebase: ${type} - ${message}`);
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
