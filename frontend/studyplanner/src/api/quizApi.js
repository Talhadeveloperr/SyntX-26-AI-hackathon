const BASE_URL = "http://136.243.35.104:8501/api";

export async function generateQuiz(payload) {
  console.log("📤 Generate Quiz Payload:", payload);
  const res = await fetch(`${BASE_URL}/quiz/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Generate quiz failed: ${res.status}`);
  const data = await res.json();
  console.log("📥 Generate Quiz Response:", data);
  return data;
}

export async function submitQuiz(payload) {
  console.log("📤 Submit Quiz Payload:", payload);
  const res = await fetch(`${BASE_URL}/quiz/submit`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Submit quiz failed: ${res.status}`);
  const data = await res.json();
  console.log("📥 Submit Quiz Response:", data);
  return data;
}
