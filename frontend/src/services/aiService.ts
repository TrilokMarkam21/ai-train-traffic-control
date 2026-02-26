import axiosInstance from "./axiosInstance";

export const aiService = {
  predict: async (data: {
    trainNumber: string;
    currentDelay: number;
    priority: number;
    trackStatus: string;
  }) => {
    // Use the correct backend route: /api/ai/predict
    const res = await axiosInstance.post("/api/ai/predict", data);
    return res.data;
  },
};
