import API from "./api";

export const getSections = () => API.get("/sections");
export const createSection = (data) => API.post("/sections", data);
