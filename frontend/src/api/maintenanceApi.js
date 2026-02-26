import axiosInstance from './api';

const maintenanceApi = {
  // Get all maintenance works
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`/maintenance?${params}`);
    return response.data;
  },

  // Get active maintenance works
  getActive: async () => {
    const response = await axiosInstance.get('/maintenance/active');
    return response.data;
  },

  // Get maintenance by ID
  getById: async (id) => {
    const response = await axiosInstance.get(`/maintenance/${id}`);
    return response.data;
  },

  // Create new maintenance work
  create: async (data) => {
    const response = await axiosInstance.post('/maintenance', data);
    return response.data;
  },

  // Update maintenance work
  update: async (id, data) => {
    const response = await axiosInstance.put(`/maintenance/${id}`, data);
    return response.data;
  },

  // Start maintenance work
  start: async (id) => {
    const response = await axiosInstance.post(`/maintenance/${id}/start`);
    return response.data;
  },

  // Complete maintenance work
  complete: async (id) => {
    const response = await axiosInstance.post(`/maintenance/${id}/complete`);
    return response.data;
  },

  // Delete maintenance work
  delete: async (id) => {
    const response = await axiosInstance.delete(`/maintenance/${id}`);
    return response.data;
  },

  // Seed sample data
  seed: async () => {
    const response = await axiosInstance.post('/maintenance/seed');
    return response.data;
  }
};

export default maintenanceApi;
