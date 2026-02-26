import axiosInstance from './api';

const scheduleApi = {
  // Get all schedules
  getAll: async () => {
    const response = await axiosInstance.get('/schedules');
    return response.data;
  },

  // Get schedule for a specific train
  getByTrain: async (trainNumber) => {
    const response = await axiosInstance.get(`/schedules/train/${trainNumber}`);
    return response.data;
  },

  // Get schedule for a specific station
  getByStation: async (stationCode) => {
    const response = await axiosInstance.get(`/schedules/station/${stationCode}`);
    return response.data;
  },

  // Add new schedule
  create: async (scheduleData) => {
    const response = await axiosInstance.post('/schedules', scheduleData);
    return response.data;
  },

  // Seed schedules
  seed: async () => {
    const response = await axiosInstance.post('/schedules/seed');
    return response.data;
  }
};

export default scheduleApi;
