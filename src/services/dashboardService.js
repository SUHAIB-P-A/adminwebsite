import api from './api';

const dashboardService = {
  /**
   * Get dashboard statistics and data
   * @param {object} filters - {role, staff_id}
   * @returns {Promise} Dashboard data with stats and recent items
   */
  getStats: (filters = {}) => api.get('/dashboard/', { params: filters })
};

export default dashboardService;
