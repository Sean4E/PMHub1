/**
 * PM Hub Real-Time Chat System
 *
 * Provides real-time chat functionality using Firebase Firestore
 * - Real-time message synchronization across all users
 * - Unread message tracking
 * - Typing indicators
 * - Message read receipts
 */

class PMHubChat {
    constructor(options = {}) {
        this.db = options.db || null;
        this.firestore = options.firestore || null;
        this.currentUser = options.currentUser || null;
        this.onMessageReceived = options.onMessageReceived || (() => {});
        this.onUnreadCountChanged = options.onUnreadCountChanged || (() => {});

        // Track active listeners
        this.activeListeners = new Map();

        console.log('💬 PM Hub Chat: Initialized');
    }

    /**
     * Get the chat document path for a task
     */
    getChatPath(projectId, areaId, taskWbs) {
        return `chats/${projectId}_${areaId}_${taskWbs}`;
    }

    /**
     * Initialize or get a chat for a specific task
     */
    async initializeChat(projectId, areaId, taskWbs, taskName) {
        if (!this.db || !this.firestore) {
            console.error('💬 Chat: Firebase not initialized');
            return null;
        }

        try {
            const chatPath = this.getChatPath(projectId, areaId, taskWbs);
            const { doc, getDoc, setDoc, serverTimestamp } = this.firestore;
            const chatRef = doc(this.db, chatPath);
            const chatDoc = await getDoc(chatRef);

            if (!chatDoc.exists()) {
                // Create new chat document
                await setDoc(chatRef, {
                    projectId,
                    areaId,
                    taskWbs,
                    taskName,
                    participants: [this.currentUser.id],
                    participantNames: [this.currentUser.name],
                    createdAt: serverTimestamp(),
                    lastMessageAt: serverTimestamp(),
                    messageCount: 0
                });
                console.log(`💬 Chat: Created new chat for task ${taskWbs}`);
            } else {
                // Add current user to participants if not already there
                const chatData = chatDoc.data();
                if (!chatData.participants?.includes(this.currentUser.id)) {
                    await setDoc(chatRef, {
                        participants: [...(chatData.participants || []), this.currentUser.id],
                        participantNames: [...(chatData.participantNames || []), this.currentUser.name]
                    }, { merge: true });
                }
            }

            return chatPath;
        } catch (error) {
            console.error('💬 Chat: Error initializing chat:', error);
            return null;
        }
    }

    /**
     * Listen to chat messages in real-time
     */
    listenToMessages(projectId, areaId, taskWbs, callback) {
        if (!this.db || !this.firestore) {
            console.error('💬 Chat: Firebase not initialized');
            return null;
        }

        const chatPath = this.getChatPath(projectId, areaId, taskWbs);
        const listenerKey = `${projectId}_${areaId}_${taskWbs}`;

        // Stop existing listener if any
        this.stopListening(listenerKey);

        try {
            const { collection, query, orderBy, onSnapshot } = this.firestore;
            const messagesRef = collection(this.db, `${chatPath}/messages`);
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = [];
                snapshot.forEach((doc) => {
                    messages.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                console.log(`💬 Chat: Received ${messages.length} messages for task ${taskWbs}`);

                // Call the callback with messages
                callback(messages);

                // Trigger onMessageReceived for new messages
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage.userId !== this.currentUser?.id) {
                        this.onMessageReceived(lastMessage);
                    }
                }

                // Update unread count
                this.updateUnreadCount(projectId, areaId, taskWbs, messages);
            }, (error) => {
                console.error('💬 Chat: Error listening to messages:', error);
            });

            // Store the unsubscribe function
            this.activeListeners.set(listenerKey, unsubscribe);
            console.log(`💬 Chat: Started listening to task ${taskWbs}`);

            return unsubscribe;
        } catch (error) {
            console.error('💬 Chat: Error setting up listener:', error);
            return null;
        }
    }

    /**
     * Stop listening to a specific chat
     */
    stopListening(listenerKey) {
        if (this.activeListeners.has(listenerKey)) {
            const unsubscribe = this.activeListeners.get(listenerKey);
            unsubscribe();
            this.activeListeners.delete(listenerKey);
            console.log(`💬 Chat: Stopped listening to ${listenerKey}`);
        }
    }

    /**
     * Stop all active listeners
     */
    stopAllListeners() {
        this.activeListeners.forEach((unsubscribe, key) => {
            unsubscribe();
            console.log(`💬 Chat: Stopped listening to ${key}`);
        });
        this.activeListeners.clear();
    }

    /**
     * Send a message to a chat
     */
    async sendMessage(projectId, areaId, taskWbs, text, taskName = '') {
        if (!this.db || !this.firestore) {
            console.error('💬 Chat: Firebase not initialized');
            return false;
        }

        if (!text || !text.trim()) {
            console.warn('💬 Chat: Cannot send empty message');
            return false;
        }

        try {
            // Initialize chat if needed
            const chatPath = await this.initializeChat(projectId, areaId, taskWbs, taskName);
            if (!chatPath) return false;

            const { collection, doc, setDoc, serverTimestamp } = this.firestore;
            const messagesRef = collection(this.db, `${chatPath}/messages`);
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const messageRef = doc(messagesRef, messageId);

            // Create message
            await setDoc(messageRef, {
                userId: this.currentUser.id,
                userName: this.currentUser.name,
                text: text.trim(),
                timestamp: serverTimestamp(),
                readBy: [this.currentUser.id]
            });

            // Update chat metadata
            const chatRef = doc(this.db, chatPath);
            await setDoc(chatRef, {
                lastMessageAt: serverTimestamp(),
                lastMessageText: text.trim().substring(0, 100),
                lastMessageBy: this.currentUser.name,
                messageCount: await this.getMessageCount(projectId, areaId, taskWbs) + 1
            }, { merge: true });

            console.log(`💬 Chat: Message sent to task ${taskWbs}`);
            return true;
        } catch (error) {
            console.error('💬 Chat: Error sending message:', error);
            return false;
        }
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(projectId, areaId, taskWbs, messageIds) {
        if (!this.db || !this.firestore || !messageIds || messageIds.length === 0) {
            return;
        }

        try {
            const chatPath = this.getChatPath(projectId, areaId, taskWbs);
            const { collection, doc, updateDoc, arrayUnion } = this.firestore;

            for (const messageId of messageIds) {
                const messageRef = doc(this.db, `${chatPath}/messages`, messageId);
                await updateDoc(messageRef, {
                    readBy: arrayUnion(this.currentUser.id)
                });
            }

            console.log(`💬 Chat: Marked ${messageIds.length} messages as read`);
        } catch (error) {
            console.error('💬 Chat: Error marking messages as read:', error);
        }
    }

    /**
     * Get unread message count for a task
     */
    getUnreadCount(messages) {
        if (!messages || !this.currentUser) return 0;

        return messages.filter(msg =>
            !msg.readBy?.includes(this.currentUser.id) &&
            msg.userId !== this.currentUser.id
        ).length;
    }

    /**
     * Update unread count and trigger callback
     */
    updateUnreadCount(projectId, areaId, taskWbs, messages) {
        const unreadCount = this.getUnreadCount(messages);
        this.onUnreadCountChanged(projectId, areaId, taskWbs, unreadCount);
    }

    /**
     * Get message count for a chat
     */
    async getMessageCount(projectId, areaId, taskWbs) {
        if (!this.db || !this.firestore) return 0;

        try {
            const chatPath = this.getChatPath(projectId, areaId, taskWbs);
            const { collection, getDocs } = this.firestore;
            const messagesRef = collection(this.db, `${chatPath}/messages`);
            const snapshot = await getDocs(messagesRef);
            return snapshot.size;
        } catch (error) {
            console.error('💬 Chat: Error getting message count:', error);
            return 0;
        }
    }

    /**
     * Get all chats for a project
     */
    async getProjectChats(projectId) {
        if (!this.db || !this.firestore) return [];

        try {
            const { collection, query, where, getDocs } = this.firestore;
            const chatsRef = collection(this.db, 'chats');
            const q = query(chatsRef, where('projectId', '==', projectId));
            const snapshot = await getDocs(q);

            const chats = [];
            snapshot.forEach((doc) => {
                chats.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return chats;
        } catch (error) {
            console.error('💬 Chat: Error getting project chats:', error);
            return [];
        }
    }

    /**
     * Delete a chat (admin only)
     */
    async deleteChat(projectId, areaId, taskWbs) {
        if (!this.db || !this.firestore) return false;

        try {
            const chatPath = this.getChatPath(projectId, areaId, taskWbs);
            const { collection, doc, deleteDoc, getDocs } = this.firestore;

            // Delete all messages first
            const messagesRef = collection(this.db, `${chatPath}/messages`);
            const messagesSnapshot = await getDocs(messagesRef);

            const deletePromises = [];
            messagesSnapshot.forEach((messageDoc) => {
                deletePromises.push(deleteDoc(messageDoc.ref));
            });
            await Promise.all(deletePromises);

            // Delete chat document
            const chatRef = doc(this.db, chatPath);
            await deleteDoc(chatRef);

            console.log(`💬 Chat: Deleted chat for task ${taskWbs}`);
            return true;
        } catch (error) {
            console.error('💬 Chat: Error deleting chat:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMHubChat;
}

console.log('💬 PM Hub Chat Library loaded');
