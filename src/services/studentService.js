import api from './api';

const studentService = {
  /**
   * Get all student submissions
   * @param {object} filters - {staff_id, status, etc.}
   * @returns {Promise} Array of student objects
   */
  getAll: (filters = {}) => api.get('/submit/', { params: filters }),

  /**
   * Get single student by ID
   * @param {number} id - Student submission ID
   * @returns {Promise} Student object
   */
  getById: (id) => api.get(`/submit/${id}/`),

  /**
   * Create new student submission
   * @param {object} data - Student data
   * @returns {Promise} Created student object
   */
  create: (data) => api.post('/submit/', data),

  /**
   * Update student submission
   * @param {number} id - Student ID
   * @param {object} data - Updated student data
   * @returns {Promise} Updated student object
   */
  update: (id, data) => api.put(`/submit/${id}/`, data),

  /**
   * Delete student submission
   * @param {number} id - Student ID
   * @returns {Promise}
   */
  delete: (id) => api.delete(`/submit/${id}/`),

  /**
   * Mark student as read
   * @param {number} id - Student ID
   * @returns {Promise}
   */
  markAsRead: (id) => api.put(`/submit/${id}/`, { is_read: true }),

  /**
   * Get students assigned to staff member
   * @param {number} staffId - Staff ID
   * @returns {Promise} Array of assigned students
   */
  getByStaff: (staffId) => api.get('/submit/', { params: { staff_id: staffId } })
};

export default studentService;
