// frontend/src/api/studyplannerApi.js
import axios from "./axiosConfig";

// ── Deadlines ──────────────────────────────────────────
export const getDeadlines  = ()          => axios.get("/studyplanner/deadlines");
export const addDeadline   = (data)      => axios.post("/studyplanner/deadlines", data);
export const updateDeadline = (id, data) => axios.put(`/studyplanner/deadlines/${id}`, data);
export const deleteDeadline = (id)       => axios.delete(`/studyplanner/deadlines/${id}`);

// ── Sessions ───────────────────────────────────────────
export const getSessions = ()       => axios.get("/studyplanner/sessions");
export const addSession  = (data)   => axios.post("/studyplanner/sessions", data);

// ── Stats ──────────────────────────────────────────────
export const getStats = () => axios.get("/studyplanner/stats");
