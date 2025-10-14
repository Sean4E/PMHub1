/**
 * PM Hub Core Library
 * Centralized authentication, data access, and shared utilities for all PM Hub modules
 * Version: 1.0.0
 */

class PMHubCore {
    constructor(config = {}) {
        this.firebaseConfig = {
            apiKey: "AIzaSyDnwDzHtjFKaWY-VwIMJtomfunkp7t9GFc",
            authDomain: "assettracker1-5b976.firebaseapp.com",
            projectId: "assettracker1-5b976",
            storageBucket: "assettracker1-5b976.firebasestorage.app",
            messagingSenderId: "260186083597",
            appId: "1:260186083597:web:5ec0eb9d5f8a4132022044"
        };

        this.db = null;
        this.firestore = null;
        this.isReady = false;
        this.currentUser = null;
        this.currentProject = null;
        this.onReadyCallbacks = [];

        // Design system tokens
        this.designTokens = {
            colors: {
                bgDark: '#0a0e27',
                bgSecondary: '#151932',
                glassBg: 'rgba(255, 255, 255, 0.05)',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
                textPrimary: '#ffffff',
                textSecondary: '#a8b2d1',
                textTertiary: '#64748b',
                accentPrimary: '#3b82f6',
                accentSecondary: '#8b5cf6',
                accentSuccess: '#10b981',
                accentWarning: '#f59e0b',
                accentDanger: '#ef4444'
            },
            borderRadius: '12px',
            shadowXl: '0 25px 50px -12px rgba(0, 0, 0, 0.36)'
        };

        // Role definitions
        this.roles = {
            ADMIN: 'admin',
            MANAGER: 'manager',
            USER: 'user'
        };

        this.init();
    }

    /**
     * Initialize Firebase connection
     */
    async init() {
        try {
            // Import Firebase modules dynamically
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, orderBy } =
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(app);
            this.firestore = { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, orderBy };
            this.isReady = true;

            console.log('✓ PM Hub Core: Firebase initialized');

            // Load user session if exists
            await this.loadSession();

            // Trigger all ready callbacks
            this.onReadyCallbacks.forEach(callback => callback());
            this.onReadyCallbacks = [];

        } catch (error) {
            console.error('PM Hub Core: Firebase initialization failed', error);
            this.isReady = false;
        }
    }

    /**
     * Wait for core to be ready
     */
    onReady(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.onReadyCallbacks.push(callback);
        }
    }

    /**
     * Load user session from localStorage
     */
    async loadSession() {
        const sessionData = localStorage.getItem('pmhub_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                this.currentUser = session.user;
                this.currentProject = session.project;
                console.log('✓ Session loaded:', this.currentUser?.name);
            } catch (error) {
                console.error('Failed to load session:', error);
            }
        }
    }

    /**
     * Save user session to localStorage
     */
    saveSession() {
        const session = {
            user: this.currentUser,
            project: this.currentProject,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('pmhub_session', JSON.stringify(session));
    }

    /**
     * User Authentication - PIN-based login
     */
    async loginWithPin(pin) {
        if (!this.isReady) {
            throw new Error('Firebase not ready');
        }

        try {
            const { collection, query, where, getDocs } = this.firestore;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('pin', '==', pin));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error('Invalid PIN');
            }

            const userDoc = snapshot.docs[0];
            this.currentUser = {
                id: userDoc.id,
                ...userDoc.data()
            };

            this.saveSession();
            console.log('✓ User logged in:', this.currentUser.name);
            return this.currentUser;

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Logout current user
     */
    logout() {
        this.currentUser = null;
        this.currentProject = null;
        localStorage.removeItem('pmhub_session');
        console.log('✓ User logged out');
    }

    /**
     * Set current project context
     */
    setProject(project) {
        this.currentProject = project;
        this.saveSession();
    }

    /**
     * Check if user has required role
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;

        const roleHierarchy = {
            admin: 3,
            manager: 2,
            user: 1
        };

        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole(this.roles.ADMIN);
    }

    /**
     * Check if user is manager or above
     */
    isManager() {
        return this.hasRole(this.roles.MANAGER);
    }

    /**
     * Get all users
     */
    async getUsers() {
        if (!this.isReady) return [];

        try {
            const { collection, getDocs, orderBy, query } = this.firestore;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, orderBy('name'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    }

    /**
     * Get all projects
     */
    async getProjects() {
        if (!this.isReady) return [];

        try {
            const { collection, getDocs, orderBy, query } = this.firestore;
            const projectsRef = collection(this.db, 'projects');
            const q = query(projectsRef, orderBy('name'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Failed to get projects:', error);
            return [];
        }
    }

    /**
     * Get user's assigned projects
     */
    async getUserProjects(userId = null) {
        const targetUserId = userId || this.currentUser?.id;
        if (!targetUserId || !this.isReady) return [];

        try {
            const { collection, query, where, getDocs } = this.firestore;
            const projectsRef = collection(this.db, 'projects');
            const q = query(projectsRef, where('assignedUsers', 'array-contains', targetUserId));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Failed to get user projects:', error);
            return [];
        }
    }

    /**
     * Create or update user
     */
    async saveUser(userData) {
        if (!this.isReady || !this.isAdmin()) {
            throw new Error('Admin access required');
        }

        try {
            const { collection, doc, setDoc, serverTimestamp } = this.firestore;
            const userId = userData.id || `user_${Date.now()}`;
            const userRef = doc(collection(this.db, 'users'), userId);

            await setDoc(userRef, {
                ...userData,
                updatedAt: serverTimestamp()
            }, { merge: true });

            return userId;
        } catch (error) {
            console.error('Failed to save user:', error);
            throw error;
        }
    }

    /**
     * Create or update project
     */
    async saveProject(projectData) {
        if (!this.isReady || !this.isManager()) {
            throw new Error('Manager access required');
        }

        try {
            const { collection, doc, setDoc, serverTimestamp } = this.firestore;
            const projectId = projectData.id || `project_${Date.now()}`;
            const projectRef = doc(collection(this.db, 'projects'), projectId);

            await setDoc(projectRef, {
                ...projectData,
                updatedAt: serverTimestamp()
            }, { merge: true });

            return projectId;
        } catch (error) {
            console.error('Failed to save project:', error);
            throw error;
        }
    }

    /**
     * Apply design tokens to document
     */
    applyDesignTokens() {
        const root = document.documentElement;
        const tokens = this.designTokens.colors;

        Object.entries(tokens).forEach(([key, value]) => {
            const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(cssVar, value);
        });

        root.style.setProperty('--border-radius', this.designTokens.borderRadius);
        root.style.setProperty('--shadow-xl', this.designTokens.shadowXl);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `pmhub-notification pmhub-notification-${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: type === 'error' ? this.designTokens.colors.accentDanger :
                       type === 'success' ? this.designTokens.colors.accentSuccess :
                       this.designTokens.colors.accentPrimary,
            color: 'white',
            borderRadius: this.designTokens.borderRadius,
            boxShadow: this.designTokens.shadowXl,
            zIndex: '10000',
            animation: 'slideIn 0.3s ease',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Format date for display
     */
    formatDate(date, includeTime = false) {
        if (!date) return '';

        const d = date instanceof Date ? date : new Date(date);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return d.toLocaleDateString('en-US', options);
    }

    /**
     * Format time for display
     */
    formatTime(date) {
        if (!date) return '';

        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    /**
     * Module Settings Management
     */
    async getModuleSettings(moduleName) {
        if (!this.isReady) {
            // Fallback to localStorage if Firebase not ready
            const stored = localStorage.getItem(`pmhub_module_${moduleName}`);
            return stored ? JSON.parse(stored) : this.getDefaultModuleSettings(moduleName);
        }

        try {
            const { collection, doc, getDoc } = this.firestore;
            const settingsRef = doc(collection(this.db, 'moduleSettings'), moduleName);
            const snapshot = await getDoc(settingsRef);

            if (snapshot.exists()) {
                return snapshot.data();
            }

            return this.getDefaultModuleSettings(moduleName);

        } catch (error) {
            console.error('Failed to get module settings:', error);
            return this.getDefaultModuleSettings(moduleName);
        }
    }

    async saveModuleSettings(moduleName, settings) {
        // Save to localStorage as backup
        localStorage.setItem(`pmhub_module_${moduleName}`, JSON.stringify(settings));

        if (!this.isReady) return;

        try {
            const { collection, doc, setDoc, serverTimestamp } = this.firestore;
            const settingsRef = doc(collection(this.db, 'moduleSettings'), moduleName);

            await setDoc(settingsRef, {
                ...settings,
                updatedAt: serverTimestamp(),
                updatedBy: this.currentUser?.id || 'system'
            }, { merge: true });

            console.log(`✓ Module settings saved: ${moduleName}`);

        } catch (error) {
            console.error('Failed to save module settings:', error);
        }
    }

    getDefaultModuleSettings(moduleName) {
        const defaults = {
            'tool-tracker': {
                itemTypes: {
                    'power-tools': { name: 'Power Tools', icon: '⚡', color: '#3b82f6' },
                    'hand-tools': { name: 'Hand Tools', icon: '🔧', color: '#10b981' },
                    'measuring': { name: 'Measuring Tools', icon: '📏', color: '#f59e0b' },
                    'safety': { name: 'Safety Equipment', icon: '🦺', color: '#ef4444' },
                    'other': { name: 'Other', icon: '📦', color: '#8b5cf6' }
                },
                styles: {
                    primaryColor: '#2c3e50',
                    secondaryColor: '#3498db',
                    accentColor: '#e74c3c'
                },
                requireCheckoutApproval: false,
                enableQRScanner: true
            },
            'clock': {
                requireLocation: true,
                allowBreaks: true,
                autoClockOut: false,
                maxDailyHours: 12,
                overtimeThreshold: 8
            },
            'reports': {
                requirePhotos: false,
                maxPhotos: 10,
                reportTypes: [
                    { id: 'daily-progress', name: 'Daily Progress' },
                    { id: 'site-inspection', name: 'Site Inspection' },
                    { id: 'incident', name: 'Incident Report' },
                    { id: 'material-delivery', name: 'Material Delivery' },
                    { id: 'quality-check', name: 'Quality Check' },
                    { id: 'safety-inspection', name: 'Safety Inspection' },
                    { id: 'other', name: 'Other' }
                ],
                requireLocation: true
            },
            'invoice': {
                companyName: '',
                companyAddress: '',
                taxRate: 0,
                currency: 'USD',
                invoicePrefix: 'INV-',
                paymentTerms: 'Net 30'
            }
        };

        return defaults[moduleName] || {};
    }
}

// Create global instance
window.PMHub = new PMHubCore();

// Add notification animation styles
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

console.log('PM Hub Core Library loaded');
