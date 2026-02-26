import axiosInstance from './api';

const trafficControlApi = {
  // Get section occupancy status
  getOccupancy: async () => {
    const response = await axiosInstance.get('/traffic/occupancy');
    return response.data;
  },

  // Detect conflicts between trains
  getConflicts: async () => {
    const response = await axiosInstance.get('/traffic/conflicts');
    return response.data;
  },

  // Get schedule adherence data
  getAdherence: async () => {
    const response = await axiosInstance.get('/traffic/adherence');
    return response.data;
  },

  // Analyze delay impact
  getDelayImpact: async () => {
    const response = await axiosInstance.get('/traffic/delay-impact');
    return response.data;
  },

  // Get platform suggestions
  getPlatformSuggestions: async (stationCode) => {
    const response = await axiosInstance.get(`/traffic/platforms/${stationCode}`);
    return response.data;
  },

  // Get comprehensive dashboard
  getDashboard: async () => {
    const response = await axiosInstance.get('/traffic/dashboard');
    return response.data;
  }
};

export default trafficControlApi;
