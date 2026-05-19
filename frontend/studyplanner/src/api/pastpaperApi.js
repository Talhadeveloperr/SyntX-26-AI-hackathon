import axios from "./axiosConfig";

// POST /pastpapers/analyze
// FormData keys: student_id, subject_id, subject_name_opt, paper_name_opt, files (multiple)
export const analyzePastPapers = (formData) =>
  axios.post("/pastpapers/analyze", formData);

// GET /pastpapers/analyses
export const getAnalyses = () =>
  axios.get("/pastpapers/analyses");

// GET /pastpapers/analyses/:id
export const getAnalysisDetails = (analysisId) =>
  axios.get(`/pastpapers/analyses/${analysisId}`);
