import axios from "axios";

const instance = axios.create({
  baseURL: "http://136.243.35.104:8501/api",
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("📤 Request:", config.method?.toUpperCase(), config.url);
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || "";

    // Never auto-logout on auth-check routes
    const isSafeRoute = url.includes("/auth/me") || 
                        url.includes("/auth/login") || 
                        url.includes("/auth/refresh");

    if (status === 401 && !isSafeRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_data");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default instance;