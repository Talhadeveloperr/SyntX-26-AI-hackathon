// frontend/studyplanner/src/api/chatApi.js
import axios from "axios";

// Using explicit base path for your custom AI runtime instance
const API_BASE_URL = "http://136.243.35.104:8501/api";

/**
 * Dispatches input message streams and files to the specialized AI processor
 * @param {Object} payload 
 * @param {string} payload.promptText - The question context strings
 * @param {boolean} payload.isNewChat - Flag defining scope initialization
 * @param {File[]} payload.files - Raw native File payloads extracted from browser inputs
 */
export const sendChatMessage = async ({ promptText, isNewChat, files = [], studentId = "1" }) => {
  const formData = new FormData();
  
  formData.append("promptText", promptText);
  formData.append("is_new_chat", String(isNewChat));
  formData.append("student_id", studentId);
  
  // Map multi-file payloads sequentially into the request stream matching Postman requirements
  if (files && files.length > 0) {
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
  }

  // Notice: Headers configuration purposefully skipped to let browser calculate correct boundaries
  const response = await axios.post(`${API_BASE_URL}/chat/message`, formData);
  return response.data;
};