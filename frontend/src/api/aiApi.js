import API from "./api";

export const predictDelay = (payload) =>
  API.post("/ai/predict-delay", payload);
