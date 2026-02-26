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

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await axiosInstance.get("/api/analytics");
    return res.data;
  },
  
  getPredictions: async () => {
    const res = await axiosInstance.get("/api/analytics/predictions");
    return res.data;
  },
  
  getRecentPredictions: async () => {
    const res = await axiosInstance.get("/api/analytics/recent");
    return res.data;
  },
  
  clearPredictions: async () => {
    const res = await axiosInstance.delete("/api/analytics/predictions");
    return res.data;
  },
};
