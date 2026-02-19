import axiosInstance from "./axiosInstance";

export const authService = {
  login: async (data) => {
    const res = await axiosInstance.post("/api/auth/login", data);
    return res.data;
  },
  register: async (data) => {
    const res = await axiosInstance.post("/api/auth/register", data);
    return res.data;
  },
};
