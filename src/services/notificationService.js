import api from './api';

const notificationService = {
  /**
   * Get all notifications for user
   * @param {object} filters - {recipient_id, is_read}
   * @returns {Promise} Array of notification objects
   */
  getAll: (filters = {}) => api.get('/notifications/', { params: filters }),

  /**
   * Get single notification
   * @param {number} id - Notification ID
   * @returns {Promise} Notification object
   */
  getById: (id) => api.get(`/notifications/${id}/`),

  /**
   * Create/Send new notification
   * @param {object} data - Notification data
   * @returns {Promise} Created notification object
   */
  create: (data) => api.post('/notifications/', data),

  /**
   * Update notification
   * @param {number} id - Notification ID
   * @param {object} data - Updated data
   * @returns {Promise} Updated notification object
   */
  update: (id, data) => api.put(`/notifications/${id}/`, data),

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  markAsRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),

  /**
   * Delete notification
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  delete: (id) => api.delete(`/notifications/${id}/`),

  /**
   * Get unread notification count
   * @param {number} userId - User ID
   * @returns {Promise} {count}
   */
  getUnreadCount: (userId) => api.get('/notifications/unread_count/', { params: { recipient_id: userId } })
};

export default notificationService;
