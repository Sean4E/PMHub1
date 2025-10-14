/**
 * PM Hub Emoji Picker
 * Simple, lightweight emoji picker for chat
 */

class PMHubEmojiPicker {
    constructor(options = {}) {
        this.onEmojiSelect = options.onEmojiSelect || (() => {});
        this.targetInput = null;

        // Popular emojis grouped by category
        this.emojis = {
            'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
            'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
            'Hearts': ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤‍🔥', '❤‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
            'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '🎯', '⛳', '🎣', '🎽', '🎿', '🛷', '⛸', '⛷'],
            'Work': ['💼', '📁', '📂', '🗂', '📅', '📆', '🗒', '🗓', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂', '🗃', '🗄', '🗑', '🔒', '🔓', '🔐', '🔑', '🗝', '🔨', '⚒', '🛠', '🔧', '🔩', '⚙', '🗜', '⚖'],
            'Symbols': ['✅', '✔', '☑', '✖', '❌', '❎', '➕', '➖', '➗', '✳', '✴', '❇', '‼', '⁉', '❓', '❔', '❕', '❗', '〰', '💯', '🔱', '⚠', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢', '☣']
        };

        this.pickerElement = null;
        this.isOpen = false;
    }

    /**
     * Create the emoji picker UI
     */
    createPicker() {
        if (this.pickerElement) {
            return this.pickerElement;
        }

        const picker = document.createElement('div');
        picker.className = 'pm-emoji-picker';
        picker.style.cssText = `
            position: absolute;
            bottom: 100%;
            right: 0;
            margin-bottom: 8px;
            background: var(--bg-secondary, #151932);
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            max-height: 300px;
            width: 320px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;

        // Create tabs
        const tabs = document.createElement('div');
        tabs.style.cssText = `
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            padding-bottom: 8px;
        `;

        Object.keys(this.emojis).forEach((category, index) => {
            const tab = document.createElement('button');
            tab.textContent = category;
            tab.className = index === 0 ? 'active' : '';
            tab.style.cssText = `
                flex: 1;
                background: ${index === 0 ? 'var(--accent-primary, #3b82f6)' : 'transparent'};
                border: none;
                color: ${index === 0 ? 'white' : 'var(--text-secondary, #a8b2d1)'};
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
            `;

            tab.onclick = () => {
                // Update active tab
                tabs.querySelectorAll('button').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary, #a8b2d1)';
                    b.classList.remove('active');
                });
                tab.style.background = 'var(--accent-primary, #3b82f6)';
                tab.style.color = 'white';
                tab.classList.add('active');

                // Show category
                this.showCategory(category);
            };

            tabs.appendChild(tab);
        });

        picker.appendChild(tabs);

        // Create emoji container
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'pm-emoji-container';
        emojiContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 4px;
        `;

        picker.appendChild(emojiContainer);

        // Show first category by default
        this.showCategory(Object.keys(this.emojis)[0], emojiContainer);

        this.pickerElement = picker;
        return picker;
    }

    /**
     * Show emojis for a specific category
     */
    showCategory(category, container = null) {
        if (!container) {
            container = this.pickerElement.querySelector('.pm-emoji-container');
        }

        container.innerHTML = '';

        this.emojis[category].forEach(emoji => {
            const emojiBtn = document.createElement('button');
            emojiBtn.textContent = emoji;
            emojiBtn.style.cssText = `
                background: transparent;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            emojiBtn.onmouseenter = () => {
                emojiBtn.style.background = 'var(--glass-bg, rgba(255,255,255,0.05))';
                emojiBtn.style.transform = 'scale(1.2)';
            };

            emojiBtn.onmouseleave = () => {
                emojiBtn.style.background = 'transparent';
                emojiBtn.style.transform = 'scale(1)';
            };

            emojiBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectEmoji(emoji);
            };

            container.appendChild(emojiBtn);
        });
    }

    /**
     * Select an emoji
     */
    selectEmoji(emoji) {
        if (this.targetInput) {
            const cursorPos = this.targetInput.selectionStart;
            const textBefore = this.targetInput.value.substring(0, cursorPos);
            const textAfter = this.targetInput.value.substring(cursorPos);

            this.targetInput.value = textBefore + emoji + textAfter;
            this.targetInput.selectionStart = this.targetInput.selectionEnd = cursorPos + emoji.length;
            this.targetInput.focus();
        }

        this.onEmojiSelect(emoji);
        this.close();
    }

    /**
     * Open the picker
     */
    open(targetInput, buttonElement) {
        this.targetInput = targetInput;

        if (!this.pickerElement) {
            this.createPicker();
        }

        // Position relative to button
        if (buttonElement && buttonElement.parentElement) {
            buttonElement.parentElement.style.position = 'relative';
            buttonElement.parentElement.appendChild(this.pickerElement);
        } else {
            document.body.appendChild(this.pickerElement);
        }

        this.pickerElement.style.display = 'block';
        this.isOpen = true;

        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
        }, 100);
    }

    /**
     * Close the picker
     */
    close() {
        if (this.pickerElement) {
            this.pickerElement.style.display = 'none';
        }
        this.isOpen = false;
        document.removeEventListener('click', this.handleClickOutside);
    }

    /**
     * Toggle picker open/closed
     */
    toggle(targetInput, buttonElement) {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(targetInput, buttonElement);
        }
    }

    /**
     * Handle clicks outside the picker
     */
    handleClickOutside = (e) => {
        if (this.pickerElement && !this.pickerElement.contains(e.target)) {
            this.close();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMHubEmojiPicker;
}

console.log('😀 PM Hub Emoji Picker loaded');
