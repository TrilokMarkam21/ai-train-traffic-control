import axiosInstance from "../services/axiosInstance";

export const trainService = {
  getAll: async () => {
    const res = await axiosInstance.get("/api/trains");
    return res.data;
  },
  create: async (data: any) => {
    const res = await axiosInstance.post("/api/trains", data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await axiosInstance.put(`/api/trains/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await axiosInstance.delete(`/api/trains/${id}`);
  },
};
