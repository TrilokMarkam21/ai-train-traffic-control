import axiosInstance from "./axiosInstance";

export const aiService = {
  predict: async (data) => {
    const res = await axiosInstance.post("/api/predict", data);
    return res.data;
  },
};
