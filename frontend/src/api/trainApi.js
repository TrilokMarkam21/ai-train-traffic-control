import API from "./api";

export const getTrains = () => API.get("/trains");
export const createTrain = (data) => API.post("/trains", data);
