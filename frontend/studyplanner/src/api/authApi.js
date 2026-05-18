    //frontend\my-react-app\src\api\authApi.js
    import axios from "./axiosConfig";

    export const register = (data) => {
    return axios.post("/auth/register", data);
    };

    export const login = (data) => {
    return axios.post("/auth/login", data);
    };
    export const forgotPassword = (email) => {
    return axios.post("/auth/forgot-password", { email });
    };

    export const resetPassword = (token, password) => {
    return axios.post(`/auth/reset-password/${token}`, { password });
    };
    export const getSqlUserId = (mongoId) => {
    return axios.get(`/auth/getuserid?mongo_id=${mongoId}`);
    };

export const updateProfile = async (data) => {
  console.log("📦 Update Profile Payload:", data);
  const res = await axios.put("/auth/profile", data);
  console.log("✅ Update Profile Response:", res.data);
  return res;
};