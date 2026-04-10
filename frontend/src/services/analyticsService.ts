// ============================================================
// frontend/src/services/analyticsService.ts  — PRODUCTION UPGRADED
// FIX 1: Was returning res.data directly — backend now wraps in
//        { success, data } so we must unwrap res.data.data
// FIX 2: Typed properly so TypeScript doesn't lose the data shape
// ============================================================

import axiosInstance from "./axiosInstance";

export interface AnalyticsData {
  delayTrends: Array<{ name: string; delay: number }>;
  priorityData: Array<{ name: string; value: number }>;
  conflictData: Array<{ name: string; low: number; medium: number; high: number }>;
  stats: {
    totalPredictions: number;
    avgDelay: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
}

const EMPTY_ANALYTICS: AnalyticsData = {
  delayTrends: [],
  priorityData: [],
  conflictData: [],
  stats: {
    totalPredictions: 0,
    avgDelay: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
  },
};

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await axiosInstance.get("/api/analytics");
    // FIX: Unwrap { success, data } envelope
    return res.data?.data || res.data || EMPTY_ANALYTICS;
  },

  getPredictions: async () => {
    const res = await axiosInstance.get("/api/analytics/predictions");
    return res.data?.data?.predictions || res.data || [];
  },

  getRecentPredictions: async () => {
    const res = await axiosInstance.get("/api/analytics/recent");
    return res.data?.data || res.data || [];
  },

  clearPredictions: async () => {
    const res = await axiosInstance.delete("/api/analytics/predictions");
    return res.data;
  },
};
