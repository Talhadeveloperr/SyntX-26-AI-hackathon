import axios from "./axiosConfig";

export async function sendChatMessage({ prompt, isNewChat, sessionId, studentId, files }) {
  const form = new FormData();
  form.append("prompt", prompt || "");
  form.append("is_new_chat", isNewChat ? "true" : "false");
  form.append("student_id", String(studentId || ""));
  if (!isNewChat && sessionId) form.append("session_id", String(sessionId));
  if (files?.length) files.forEach(f => form.append("files", f));

  console.log("📦 Chat Payload:", {
    prompt, is_new_chat: isNewChat, session_id: sessionId,
    student_id: studentId, files: files?.map(f => f.name),
  });

  const res = await axios.post("/chat/message", form);
  console.log("✅ Chat Response:", res.data);
  return res.data;
}
