import api from './api';

const enquiryService = {
  /**
   * Get all enquiries
   * @param {object} filters - {staff_id, status, etc.}
   * @returns {Promise} Array of enquiry objects
   */
  getAll: (filters = {}) => api.get('/enquiries/', { params: filters }),

  /**
   * Get single enquiry by ID
   * @param {number} id - Enquiry ID
   * @returns {Promise} Enquiry object
   */
  getById: (id) => api.get(`/enquiries/${id}/`),

  /**
   * Create new enquiry
   * @param {object} data - Enquiry data
   * @returns {Promise} Created enquiry object
   */
  create: (data) => api.post('/enquiries/', data),

  /**
   * Update enquiry
   * @param {number} id - Enquiry ID
   * @param {object} data - Updated enquiry data
   * @returns {Promise} Updated enquiry object
   */
  update: (id, data) => api.put(`/enquiries/${id}/`, data),

  /**
   * Delete enquiry
   * @param {number} id - Enquiry ID
   * @returns {Promise}
   */
  delete: (id) => api.delete(`/enquiries/${id}/`),

  /**
   * Mark enquiry as read
   * @param {number} id - Enquiry ID
   * @returns {Promise}
   */
  markAsRead: (id) => api.put(`/enquiries/${id}/`, { is_read: true }),

  /**
   * Get enquiries assigned to staff member
   * @param {number} staffId - Staff ID
   * @returns {Promise} Array of assigned enquiries
   */
  getByStaff: (staffId) => api.get('/enquiries/', { params: { staff_id: staffId } })
};

export default enquiryService;
