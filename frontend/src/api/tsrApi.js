import API from "./api";

export const getTSR = () => API.get("/tsr");
export const createTSR = (data) => API.post("/tsr", data);
