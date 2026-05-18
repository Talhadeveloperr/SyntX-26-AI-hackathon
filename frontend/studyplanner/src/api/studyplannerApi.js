import axios from "./axiosConfig";

function getStudentId() {
  try {
    const stored = localStorage.getItem("user_data");
    return stored ? JSON.parse(stored).student_id : null;
  } catch {
    return null;
  }
}

// ── Deadlines ──────────────────────────────────────────

export const getDeadlines = async () => {
  const student_id = getStudentId();
  console.log("📤 GET Deadlines | student_id:", student_id);
  const res = await axios.get("/studyplanner/deadlines");
  console.log("📥 GET Deadlines Response:", res.data);
  return res;
};

export const addDeadline = async (data) => {
  const student_id = getStudentId();
  const payload = { student_id, ...data };
  console.log("📦 Add Deadline Payload:", payload);
  const res = await axios.post("/studyplanner/deadlines", data);
  console.log("✅ Add Deadline Response:", res.data);
  return res;
};

export const updateDeadline = async (id, data) => {
  const student_id = getStudentId();
  const payload = { deadline_id: id, student_id, ...data };
  console.log("📦 Update Deadline Payload:", payload);
  const res = await axios.put(`/studyplanner/deadlines/${id}`, data);
  console.log("✅ Update Deadline Response:", res.data);
  return res;
};

export const deleteDeadline = async (id) => {
  const student_id = getStudentId();
  console.log("📦 Delete Deadline Payload:", { deadline_id: id, student_id });
  const res = await axios.delete(`/studyplanner/deadlines/${id}`);
  console.log("✅ Delete Deadline Response:", res.data);
  return res;
};

// ── Sessions ───────────────────────────────────────────

export const getSessions = async () => {
  const student_id = getStudentId();
  console.log("📤 GET Sessions | student_id:", student_id);
  const res = await axios.get("/studyplanner/sessions");
  console.log("📥 GET Sessions Response:", res.data);
  return res;
};

export const addSession = async (data) => {
  const student_id = getStudentId();
  const payload = { student_id, ...data };
  console.log("📦 Add Session Payload:", payload);
  const res = await axios.post("/studyplanner/sessions", data);
  console.log("✅ Add Session Response:", res.data);
  return res;
};

// ── Stats ──────────────────────────────────────────────

export const getStats = async () => {
  const student_id = getStudentId();
  console.log("📤 GET Stats | student_id:", student_id);
  const res = await axios.get("/studyplanner/stats");
  console.log("📥 GET Stats Response:", res.data);
  return res;
};
