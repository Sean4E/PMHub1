/**
 * PM Hub Authentication & Role-Based Access Control
 * Handles user authentication, role management, and UI visibility
 * Version: 1.0.0
 */

class PMHubAuth {
    constructor(core) {
        this.core = core;
        this.loginCallbacks = [];
        this.logoutCallbacks = [];
    }

    /**
     * Show login UI
     */
    showLoginScreen(options = {}) {
        const {
            title = 'PM Hub Login',
            subtitle = 'Enter your PIN to continue',
            onSuccess = null,
            allowSkip = false
        } = options;

        // Create login overlay
        const overlay = document.createElement('div');
        overlay.id = 'pmhub-login-overlay';
        overlay.className = 'pmhub-login-overlay';

        overlay.innerHTML = `
            <div class="pmhub-login-container">
                <div class="pmhub-login-card glass-panel">
                    <div class="pmhub-login-header">
                        <h1 class="pmhub-logo">PM Hub</h1>
                        <h2>${title}</h2>
                        <p class="text-secondary">${subtitle}</p>
                    </div>

                    <div class="pmhub-pin-entry">
                        <div class="pmhub-pin-display">
                            <span id="pin-dots"></span>
                        </div>

                        <div class="pmhub-pin-pad">
                            ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(num =>
                                `<button class="pin-btn ${num === '' ? 'invisible' : ''}" data-num="${num}">${num}</button>`
                            ).join('')}
                        </div>

                        <div class="pmhub-login-actions">
                            ${allowSkip ? '<button class="btn btn-secondary" id="skip-login">Continue as Guest</button>' : ''}
                        </div>
                    </div>

                    <div class="pmhub-login-footer">
                        <div class="status-indicator">
                            <div class="status-dot ${this.core.isReady ? 'connected' : 'disconnected'}"></div>
                            <span>${this.core.isReady ? 'Connected' : 'Offline Mode'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .pmhub-login-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-secondary) 50%, var(--bg-dark) 100%);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .pmhub-login-overlay::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background:
                    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
                pointer-events: none;
            }

            .pmhub-login-container {
                position: relative;
                z-index: 2;
                width: 100%;
                max-width: 450px;
                padding: 20px;
            }

            .pmhub-login-card {
                text-align: center;
            }

            .pmhub-login-header {
                margin-bottom: 40px;
            }

            .pmhub-login-header h2 {
                margin: 20px 0 10px;
                font-size: 24px;
            }

            .pmhub-pin-entry {
                padding: 20px 0;
            }

            .pmhub-pin-display {
                min-height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 30px;
                font-size: 36px;
                letter-spacing: 15px;
                font-family: monospace;
            }

            .pmhub-pin-pad {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                max-width: 300px;
                margin: 0 auto;
            }

            .pin-btn {
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                padding: 25px;
                font-size: 24px;
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: all var(--transition-base);
            }

            .pin-btn:hover:not(.invisible) {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.05);
            }

            .pin-btn:active:not(.invisible) {
                transform: scale(0.95);
            }

            .pin-btn.invisible {
                background: transparent;
                border: none;
                cursor: default;
            }

            .pmhub-login-actions {
                margin-top: 30px;
            }

            .pmhub-login-footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--glass-border);
                display: flex;
                justify-content: center;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .shake {
                animation: shake 0.5s;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);

        // Add to DOM
        document.body.appendChild(overlay);

        // PIN entry logic
        let pin = '';
        const pinDots = document.getElementById('pin-dots');
        const pinButtons = overlay.querySelectorAll('.pin-btn');

        const updatePinDisplay = () => {
            pinDots.textContent = '●'.repeat(pin.length);
        };

        const attemptLogin = async () => {
            if (pin.length < 4) return;

            try {
                const user = await this.core.loginWithPin(pin);
                this.onLoginSuccess(user);
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => overlay.remove(), 300);

                if (onSuccess) onSuccess(user);

                // Trigger login callbacks
                this.loginCallbacks.forEach(cb => cb(user));

            } catch (error) {
                // Wrong PIN - shake animation
                pinDots.parentElement.classList.add('shake');
                setTimeout(() => pinDots.parentElement.classList.remove('shake'), 500);

                this.core.showNotification('Invalid PIN', 'error');
                pin = '';
                updatePinDisplay();
            }
        };

        pinButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const num = btn.dataset.num;

                if (num === '⌫') {
                    pin = pin.slice(0, -1);
                } else if (num && num !== '') {
                    pin += num;
                    if (pin.length === 4) {
                        setTimeout(attemptLogin, 100);
                    }
                }

                updatePinDisplay();
            });
        });

        // Skip login if allowed
        if (allowSkip) {
            document.getElementById('skip-login')?.addEventListener('click', () => {
                overlay.remove();
                if (onSuccess) onSuccess(null);
            });
        }

        // Add fadeOut animation
        const fadeOutStyle = document.createElement('style');
        fadeOutStyle.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(fadeOutStyle);
    }

    /**
     * Handle successful login
     */
    onLoginSuccess(user) {
        // Apply role class to body
        document.body.classList.remove('role-admin', 'role-manager', 'role-user');
        document.body.classList.add(`role-${user.role}`);

        // Update UI elements
        this.updateUserInfo(user);

        this.core.showNotification(`Welcome, ${user.name}!`, 'success');
    }

    /**
     * Update user info in UI
     */
    updateUserInfo(user) {
        // Update all elements with class 'user-name'
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name;
        });

        // Update all elements with class 'user-role'
        document.querySelectorAll('.user-role').forEach(el => {
            el.textContent = user.role;
        });

        // Update all elements with class 'user-email'
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = user.email || '';
        });
    }

    /**
     * Logout current user
     */
    logout() {
        this.core.logout();
        document.body.classList.remove('role-admin', 'role-manager', 'role-user');

        // Trigger logout callbacks
        this.logoutCallbacks.forEach(cb => cb());

        this.core.showNotification('Logged out successfully', 'info');
    }

    /**
     * Require authentication - redirect to login if not logged in
     */
    requireAuth(options = {}) {
        if (!this.core.currentUser) {
            this.showLoginScreen(options);
            return false;
        }
        return true;
    }

    /**
     * Require specific role - show error if user doesn't have permission
     */
    requireRole(role, message = 'You do not have permission to access this feature') {
        if (!this.core.hasRole(role)) {
            this.core.showNotification(message, 'error');
            return false;
        }
        return true;
    }

    /**
     * Check if element should be visible based on role
     */
    checkElementVisibility(element) {
        const requiredRole = element.dataset.role;
        if (!requiredRole) return true;

        return this.core.hasRole(requiredRole);
    }

    /**
     * Apply role-based visibility to all elements
     */
    applyRoleVisibility() {
        document.querySelectorAll('[data-role]').forEach(element => {
            const visible = this.checkElementVisibility(element);
            element.style.display = visible ? '' : 'none';
        });
    }

    /**
     * Register callback for login event
     */
    onLogin(callback) {
        this.loginCallbacks.push(callback);
    }

    /**
     * Register callback for logout event
     */
    onLogout(callback) {
        this.logoutCallbacks.push(callback);
    }

    /**
     * Get current user's display info
     */
    getCurrentUserInfo() {
        if (!this.core.currentUser) {
            return {
                name: 'Guest',
                role: 'none',
                initials: 'G'
            };
        }

        const user = this.core.currentUser;
        const nameParts = user.name.split(' ');
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2);

        return {
            name: user.name,
            role: user.role,
            email: user.email || '',
            initials
        };
    }

    /**
     * Create user menu component
     */
    createUserMenu() {
        const userInfo = this.getCurrentUserInfo();

        const menu = document.createElement('div');
        menu.className = 'pmhub-user-menu';
        menu.innerHTML = `
            <button class="user-menu-trigger btn btn-secondary">
                <span class="user-avatar">${userInfo.initials}</span>
                <span class="user-name">${userInfo.name}</span>
                <span class="user-role-badge badge badge-primary">${userInfo.role}</span>
            </button>
            <div class="user-menu-dropdown hidden">
                <div class="user-menu-header">
                    <div class="user-avatar-large">${userInfo.initials}</div>
                    <div class="user-info">
                        <div class="user-name">${userInfo.name}</div>
                        <div class="user-email text-secondary">${userInfo.email}</div>
                    </div>
                </div>
                <div class="user-menu-actions">
                    <button class="btn btn-secondary btn-small" id="user-menu-logout">Logout</button>
                </div>
            </div>
        `;

        // Add dropdown styles
        const style = document.createElement('style');
        style.textContent = `
            .pmhub-user-menu {
                position: relative;
            }

            .user-menu-trigger {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--accent-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
            }

            .user-role-badge {
                font-size: 10px;
            }

            .user-menu-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-xl);
                min-width: 250px;
                padding: 20px;
                z-index: 1000;
            }

            .user-menu-header {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--glass-border);
            }

            .user-avatar-large {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: var(--accent-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 18px;
            }

            .user-menu-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);

        // Toggle dropdown
        const trigger = menu.querySelector('.user-menu-trigger');
        const dropdown = menu.querySelector('.user-menu-dropdown');

        trigger.addEventListener('click', () => {
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Logout button
        menu.querySelector('#user-menu-logout').addEventListener('click', () => {
            this.logout();
            location.reload();
        });

        return menu;
    }
}

// Initialize Auth when PMHub is ready
window.addEventListener('DOMContentLoaded', () => {
    if (window.PMHub) {
        window.PMHubAuth = new PMHubAuth(window.PMHub);
        console.log('PM Hub Auth initialized');
    }
});
