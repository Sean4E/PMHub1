/**
 * PM Hub Real-Time Sync & Notification System
 *
 * This module provides:
 * 1. Real-time Firebase listeners (no polling)
 * 2. Smart partial state updates (no page reloads)
 * 3. Beautiful toast notifications
 * 4. Event-driven architecture
 */

class PMHubRealtimeSync {
    constructor(options = {}) {
        this.appName = options.appName || 'Unknown';
        this.currentUser = options.currentUser || null;
        this.onStateUpdate = options.onStateUpdate || (() => {});

        // BroadcastChannel for cross-tab sync
        this.stateChannel = new BroadcastChannel('pm_hub_state');

        // Firebase listener
        this.firebaseUnsubscribe = null;

        // Track last update to avoid duplicate notifications
        // Start at 0 so we receive ALL Firebase updates when we first load
        this.lastUpdateTimestamp = 0;
        this.lastUpdateSource = null;

        // Notification queue to avoid spam
        this.notificationQueue = [];
        this.notificationTimer = null;

        this.init();
    }

    init() {
        console.log(`🚀 ${this.appName}: Real-time sync initialized`);
        console.log(`   - User:`, this.currentUser?.name || 'Unknown');
        console.log(`   - Firebase available:`, !!window.firebaseEnabled);
        console.log(`   - BroadcastChannel created:`, !!this.stateChannel);

        // Listen to BroadcastChannel messages
        this.stateChannel.onmessage = (event) => this.handleBroadcastMessage(event);

        // Set up Firebase real-time listener
        this.setupFirebaseListener();

        // Clean up on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupFirebaseListener() {
        if (!window.firebaseEnabled || !window.db) {
            console.log(`ℹ️ ${this.appName}: Firebase not available, using BroadcastChannel only`);
            return;
        }

        try {
            const docRef = window.firestore.doc(window.db, 'hubs', 'main');

            // Real-time listener - only fires when data actually changes
            this.firebaseUnsubscribe = window.firestore.onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();

                    // Check if this is a real update (newer than last received)
                    const updateTimestamp = data.lastModified ? new Date(data.lastModified).getTime() : 0;

                    // CRITICAL: Skip updates that we just wrote ourselves (prevents echo/flash)
                    // Allow a 500ms grace period for our own writes to propagate
                    const timeSinceLastUpdate = Date.now() - this.lastUpdateTimestamp;
                    const isOwnUpdate = data.lastSyncedBy === (this.currentUser?.name || 'System') && timeSinceLastUpdate < 500;

                    if (isOwnUpdate) {
                        console.log(`🔄 ${this.appName}: Skipping own Firebase write echo (${data.lastSyncedBy})`);
                        // Update timestamp to prevent processing this update again
                        this.lastUpdateTimestamp = updateTimestamp;
                        return;
                    }

                    if (updateTimestamp > this.lastUpdateTimestamp) {
                        console.log(`☁️ ${this.appName}: Firebase update detected from ${data.lastSyncedBy}`);
                        console.log(`   - Update timestamp: ${updateTimestamp} > Last: ${this.lastUpdateTimestamp}`);

                        this.handleStateUpdate({
                            source: 'firebase',
                            data: data,
                            syncedBy: data.lastSyncedBy,
                            timestamp: updateTimestamp
                        });
                    } else {
                        console.log(`⏭️ ${this.appName}: Skipping old/duplicate Firebase update (timestamp: ${updateTimestamp})`);
                    }
                }
            }, (error) => {
                console.error(`❌ ${this.appName}: Firebase listener error:`, error);
            });

            console.log(`✓ ${this.appName}: Firebase real-time listener active`);
        } catch (error) {
            console.error(`❌ ${this.appName}: Failed to setup Firebase listener:`, error);
        }
    }

    handleBroadcastMessage(event) {
        console.log(`📻 ${this.appName}: Broadcast message received`, {
            type: event.data.type,
            source: event.data.source,
            myAppName: this.appName.toLowerCase()
        });

        if (event.data.type === 'STATE_UPDATED' && event.data.source !== this.appName.toLowerCase()) {
            console.log(`📡 ${this.appName}: Broadcast received from ${event.data.source}`);
            console.log(`   - Timestamp check: ${event.data.timestamp} > ${this.lastUpdateTimestamp}? ${event.data.timestamp > this.lastUpdateTimestamp}`);

            // Only process if this is a newer update
            if (event.data.timestamp > this.lastUpdateTimestamp) {
                console.log(`✅ ${this.appName}: Processing broadcast update`);
                this.handleStateUpdate({
                    source: 'broadcast',
                    section: event.data.section,
                    syncedBy: event.data.syncedBy,
                    activity: event.data.activity,
                    timestamp: event.data.timestamp
                });
            } else {
                console.log(`⏭️ ${this.appName}: Skipping old broadcast`);
            }
        } else if (event.data.source === this.appName.toLowerCase()) {
            console.log(`🔄 ${this.appName}: Ignoring own broadcast`);
        }
    }

    handleStateUpdate(update) {
        console.log(`🔄 ${this.appName}: Handling state update`, {
            source: update.source,
            section: update.section,
            syncedBy: update.syncedBy
        });

        this.lastUpdateTimestamp = update.timestamp;
        this.lastUpdateSource = update.source;

        let newState;

        // If update came from Firebase, use the data FROM Firebase
        if (update.source === 'firebase' && update.data) {
            console.log(`☁️ ${this.appName}: Using data from Firebase`);
            newState = update.data;

            // Update localStorage with Firebase data
            localStorage.setItem('pmSystemState', JSON.stringify(newState));
            console.log(`✅ ${this.appName}: localStorage updated from Firebase`);
        } else {
            // For broadcast updates, load from localStorage (already updated by same-browser app)
            const stateStr = localStorage.getItem('pmSystemState');
            if (stateStr) {
                newState = JSON.parse(stateStr);
                console.log(`✅ ${this.appName}: State loaded from localStorage`);
            } else {
                console.error(`❌ ${this.appName}: No state found in localStorage!`);
                return;
            }
        }

        // Call the app-specific update handler
        console.log(`🎯 ${this.appName}: Calling onStateUpdate callback`);
        this.onStateUpdate(newState, update);

        // Show notification if there's activity info
        if (update.activity) {
            this.queueNotification(update.activity, update.syncedBy);
        }
    }

    queueNotification(activity, syncedBy) {
        // Don't show notifications for our own actions
        if (syncedBy === this.currentUser?.name) {
            return;
        }

        this.notificationQueue.push({ activity, syncedBy });

        // Debounce notifications (show max once per 2 seconds)
        if (!this.notificationTimer) {
            this.notificationTimer = setTimeout(() => {
                this.processNotificationQueue();
                this.notificationTimer = null;
            }, 2000);
        }
    }

    processNotificationQueue() {
        if (this.notificationQueue.length === 0) return;

        // Group notifications by user
        const grouped = this.notificationQueue.reduce((acc, notif) => {
            if (!acc[notif.syncedBy]) {
                acc[notif.syncedBy] = [];
            }
            acc[notif.syncedBy].push(notif.activity);
            return acc;
        }, {});

        // Show grouped notification
        for (const [user, activities] of Object.entries(grouped)) {
            const message = activities.length === 1
                ? activities[0].message
                : `${activities.length} updates`;

            this.showNotification(user, message, activities[0].type);
        }

        this.notificationQueue = [];
    }

    showNotification(user, message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `pm-realtime-notification ${this.getNotificationClass(type)}`;
        notification.innerHTML = `
            <div class="pm-notif-header">
                <span class="pm-notif-icon">${this.getNotificationIcon(type)}</span>
                <span class="pm-notif-user">${user}</span>
                <button class="pm-notif-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="pm-notif-message">${message}</div>
        `;

        // Add to page
        let container = document.getElementById('pm-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pm-notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Play subtle notification sound (optional)
        this.playNotificationSound();
    }

    getNotificationIcon(type) {
        const icons = {
            'TASK_START': '▶️',
            'TASK_COMPLETE': '✅',
            'TASK_CREATED': '📋',
            'AREA_CREATED': '📍',
            'TOOL_CHECKOUT': '🔧',
            'TOOL_CHECKIN': '✓',
            'USER_CREATED': '👤',
            'REPORT': '📸',
            'CLOCK_IN': '⏰',
            'CLOCK_OUT': '🏁'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationClass(type) {
        if (['TASK_COMPLETE', 'AREA_COMPLETE', 'TOOL_CHECKIN'].includes(type)) {
            return 'success';
        }
        if (['TASK_START', 'CLOCK_IN'].includes(type)) {
            return 'info';
        }
        if (['AWAITING_TASKS'].includes(type)) {
            return 'warning';
        }
        return 'info';
    }

    playNotificationSound() {
        // Subtle notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silent fail - audio not critical
        }
    }

    broadcast(section, activity = null) {
        this.stateChannel.postMessage({
            type: 'STATE_UPDATED',
            source: this.appName.toLowerCase(),
            section: section,
            syncedBy: this.currentUser?.name,
            activity: activity,
            timestamp: Date.now()
        });
    }

    cleanup() {
        if (this.firebaseUnsubscribe) {
            this.firebaseUnsubscribe();
        }
        this.stateChannel.close();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMHubRealtimeSync;
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    #pm-notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 350px;
        pointer-events: none;
    }

    .pm-realtime-notification {
        background: rgba(21, 25, 50, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        animation: slideIn 0.3s ease;
        pointer-events: auto;
        min-width: 300px;
    }

    .pm-realtime-notification.success {
        border-left: 4px solid #10b981;
    }

    .pm-realtime-notification.info {
        border-left: 4px solid #3b82f6;
    }

    .pm-realtime-notification.warning {
        border-left: 4px solid #f59e0b;
    }

    .pm-notif-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
    }

    .pm-notif-icon {
        font-size: 16px;
    }

    .pm-notif-user {
        flex: 1;
        font-weight: 600;
        color: #ffffff;
    }

    .pm-notif-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pm-notif-close:hover {
        color: #ffffff;
    }

    .pm-notif-message {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        line-height: 1.4;
    }

    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @media (max-width: 600px) {
        #pm-notification-container {
            right: 10px;
            left: 10px;
            max-width: none;
        }

        .pm-realtime-notification {
            min-width: auto;
        }
    }
`;
document.head.appendChild(style);
