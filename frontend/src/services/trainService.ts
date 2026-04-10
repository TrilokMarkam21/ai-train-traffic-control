// ============================================================
// frontend/src/services/trainService.ts  — PRODUCTION UPGRADED
// FIX 1: Unwraps { success, data } response envelope
//        (was using res.data directly which returned the wrapper)
// FIX 2: Added getStats() for dashboard real stats
// FIX 3: Added updatePosition() for real-time tracking updates
// ============================================================

import axiosInstance from "./axiosInstance";

export interface Train {
  _id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
  status: "On Time" | "Delayed" | "In Transit" | "Cancelled";
  priority: number;
  delay: number;
  currentSection?: {
    _id: string;
    sectionId: string;
    name: string;
    status: string;
    startStation: string;
    endStation: string;
  };
  latitude?: number;
  longitude?: number;
  speedKmph?: number;
  lastUpdated?: string;
}

export interface TrainStats {
  total: number;
  onTime: number;
  delayed: number;
  avgDelay: number;
}

export const trainService = {
  getAll: async (params?: { status?: string; search?: string }): Promise<Train[]> => {
    const res = await axiosInstance.get("/api/trains", { params });
    // FIX: Unwrap { success, data } envelope
    return res.data?.data || res.data || [];
  },

  getById: async (id: string): Promise<Train> => {
    const res = await axiosInstance.get(`/api/trains/${id}`);
    return res.data?.data || res.data;
  },

  getStats: async (): Promise<TrainStats> => {
    const res = await axiosInstance.get("/api/trains/stats");
    return res.data?.data || { total: 0, onTime: 0, delayed: 0, avgDelay: 0 };
  },

  create: async (data: Partial<Train>): Promise<Train> => {
    const res = await axiosInstance.post("/api/trains", data);
    return res.data?.data || res.data;
  },

  update: async (id: string, data: Partial<Train>): Promise<Train> => {
    const res = await axiosInstance.put(`/api/trains/${id}`, data);
    return res.data?.data || res.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/trains/${id}`);
  },

  updatePosition: async (
    id: string,
    position: { latitude: number; longitude: number; speedKmph?: number; status?: string }
  ): Promise<Train> => {
    const res = await axiosInstance.patch(`/api/trains/${id}/position`, position);
    return res.data?.data || res.data;
  },
};
