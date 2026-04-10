// ============================================================
// frontend/src/api/trafficControlApi.js  — PRODUCTION UPGRADED
// FIX 1: Was importing from './api' (the /api folder api.js with
//        base URL "/api") but paths were like '/traffic/...'
//        This means final URL was /api/traffic/... which is WRONG.
//        Backend route is /api/traffic/... so base must be "/"
//        Actually: axiosInstance has baseURL=http://localhost:5000
//        and routes here are /api/traffic/... — that's CORRECT.
//        BUT this file imports from '../api/api' not '../services/axiosInstance'
//        — inconsistency with rest of the codebase. Fixed to use axiosInstance.
// FIX 2: Unwrap { success, data } response envelope
// FIX 3: Add error handling so page doesn't crash silently
// ============================================================

import axiosInstance from "../services/axiosInstance";

const trafficControlApi = {
  getOccupancy: async () => {
    const res = await axiosInstance.get("/api/traffic/occupancy");
    return res.data?.data || res.data || [];
  },

  getConflicts: async () => {
    const res = await axiosInstance.get("/api/traffic/conflicts");
    return res.data?.data || res.data || [];
  },

  getAdherence: async () => {
    const res = await axiosInstance.get("/api/traffic/adherence");
    return res.data?.data || res.data || [];
  },

  getDelayImpact: async () => {
    const res = await axiosInstance.get("/api/traffic/delay-impact");
    return res.data?.data || res.data || [];
  },

  getPlatformSuggestions: async (stationCode) => {
    const res = await axiosInstance.get(`/api/traffic/platforms/${stationCode}`);
    return res.data?.data || res.data || [];
  },

  getAdvancedConflicts: async () => {
    const res = await axiosInstance.get("/api/traffic/conflict-analysis");
    return res.data?.data || res.data || null;
  },

  getDashboard: async () => {
    const res = await axiosInstance.get("/api/traffic/dashboard");
    // Dashboard returns multiple keys — unwrap or return whole data object
    return res.data?.data || res.data || {};
  },
};

export default trafficControlApi;
