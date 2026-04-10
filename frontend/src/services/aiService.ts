// ============================================================
// frontend/src/services/aiService.ts  — PRODUCTION UPGRADED
// FIX 1: Response type now includes factors[] and recommendation
//        (was not typed, so frontend silently ignored these fields)
// FIX 2: Unwraps { success, data } response envelope
// ============================================================

import axiosInstance from "./axiosInstance";

export interface AIPrediction {
  predictedDelay: number;
  conflictRisk: "Low" | "Medium" | "High";
  confidence: number;
  factors: string[];        // NEW: Explainable AI factors
  recommendation: string;   // NEW: Actionable operator guidance
  source?: "ai_model" | "fallback";
}

export interface AIPredictRequest {
  trainNumber: string;
  currentDelay: number;
  priority: number;
  trackStatus: "Clear" | "Congested" | "Under Maintenance" | "Blocked" | "Occupied";
}

export const aiService = {
  predict: async (data: AIPredictRequest): Promise<AIPrediction> => {
    const res = await axiosInstance.post("/api/ai/predict", data);
    // FIX: Backend now returns { success, data: {...} } envelope
    // Handle both old format (direct) and new format (wrapped)
    const payload = res.data?.data || res.data;
    return payload as AIPrediction;
  },

  getServiceStatus: async () => {
    const res = await axiosInstance.get("/api/ai/service-status");
    return res.data?.data || res.data;
  },

  getHistory: async (limit = 20) => {
    const res = await axiosInstance.get(`/api/ai/history?limit=${limit}`);
    return res.data?.data?.predictions || [];
  },
};
