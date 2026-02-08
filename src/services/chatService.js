import api from './api';

const chatService = {
  /**
   * Get chat users/contacts
   * @param {object} params - {exclude_id, polling}
   * @returns {Promise} Array of chat user objects
   */
  getUsers: (params = {}) => api.get('/chat/users/', { params }),

  /**
   * Get messages for a conversation
   * @param {number} userId - User ID to chat with
   * @returns {Promise} Array of message objects
   */
  getMessages: (userId) => api.get(`/chat/messages/${userId}/`),

  /**
   * Send a message
   * @param {object} data - {sender, receiver, content}
   * @returns {Promise} Sent message object
   */
  sendMessage: (data) => api.post('/chat/send/', data),

  /**
   * Get unread message count
   * @param {number} userId - User ID
   * @returns {Promise} {count}
   */
  getUnreadCount: (userId) => api.get('/chat/unread_count/', { params: { user_id: userId } }),

  /**
   * Mark messages as read
   * @param {number} chatId - Chat ID
   * @returns {Promise}
   */
  markAsRead: (chatId) => api.post(`/chat/${chatId}/mark_read/`),

  /**
   * Clear chat history
   * @param {number} chatId - Chat ID
   * @param {string} scope - 'local' or 'everyone'
   * @returns {Promise}
   */
  clearChat: (chatId, scope = 'local') => api.post(`/chat/${chatId}/clear/`, { scope })
};

export default chatService;
