import axiosInstance from "./axiosInstance";

const unwrapAuthPayload = (res: any) => {
  const payload = res?.data?.data || res?.data || {};
  return {
    token: payload.token,
    user: payload.user,
  };
};

export const authService = {
  login: async (data) => {
    const res = await axiosInstance.post("/api/auth/login", data);
    return unwrapAuthPayload(res);
  },
  register: async (data) => {
    const res = await axiosInstance.post("/api/auth/register", data);
    return unwrapAuthPayload(res);
  },
};
