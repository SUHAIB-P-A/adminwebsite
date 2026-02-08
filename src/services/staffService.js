import api from './api';

const staffService = {
  /**
   * Get all staff members
   * @returns {Promise} Array of staff objects
   */
  getAll: () => api.get('/staff/'),

  /**
   * Get single staff member by ID
   * @param {number} id - Staff ID
   * @returns {Promise} Staff object
   */
  getById: (id) => api.get(`/staff/${id}/`),

  /**
   * Update staff member
   * @param {number} id - Staff ID
   * @param {object} data - Updated staff data
   * @returns {Promise} Updated staff object
   */
  update: (id, data) => api.put(`/staff/${id}/`, data),

  /**
   * Delete staff member
   * @param {number} id - Staff ID
   * @returns {Promise}
   */
  delete: (id) => api.delete(`/staff/${id}/`),

  /**
   * Create new staff member
   * @param {object} data - Staff data
   * @returns {Promise} Created staff object
   */
  create: (data) => api.post('/staff/', data),

  /**
   * Login staff member
   * @param {object} credentials - {login_id, password}
   * @returns {Promise} {staff_id, name, email, role, ...}
   */
  login: (credentials) => api.post('/staff-login/', credentials),

  /**
   * Get staff documents
   * @param {number} staffId - Staff ID
   * @returns {Promise} Array of documents
   */
  getDocuments: (staffId) => api.get('/staff-documents/', { params: { staff_id: staffId } }),

  /**
   * Upload staff document
   * @param {number} staffId - Staff ID
   * @param {FormData} formData - Document file
   * @returns {Promise} Created document
   */
  uploadDocument: (staffId, formData) => api.post('/staff-documents/', formData, {
    params: { staff_id: staffId },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default staffService;
