import axios from "axios";
import { serverURL } from "./serverURL";

export const commonAPI = async (method, url, body = {}, isFormData = false) => {
  try {
    let headers = {};

    // Auto-detect FormData OR when isFormData = true
    if (body instanceof FormData || isFormData) {
      headers["Content-Type"] = "multipart/form-data";
    } else {
      headers["Content-Type"] = "application/json";
    }

    // 🟢 ATTACH TOKEN (Was missing!)
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios({
      method,
      url,
      data: body,
      headers,
    });

    return response;
  } catch (error) {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!refreshToken) {
           localStorage.clear();
           // window.location.href = "/"; // letting component handle redirect or doing it here
           return error.response;
        }

        const res = await axios.post(`${serverURL}/auth/refresh-token`, { refreshToken });

        if (res.status === 200) {
          const newAccessToken = res.data.token;
          
          // Update User object with new token
          if (user) {
             user.token = newAccessToken; // If token is stored in user object
             localStorage.setItem("user", JSON.stringify(user));
          }
           // Also update standalone token if you store it separately? 
           // UserController login returns "token" separately. user object usually has it too?
           // Frontend Login.jsx stores: localStorage.setItem("token", res.data.token);
           localStorage.setItem("token", newAccessToken);

          // Retry Original Request
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
         console.error("RefreshToken Failed:", refreshError);
         localStorage.clear();
         window.location.href = "/"; // Force logout
         return Promise.reject(refreshError);
      }
    }

    console.error("API ERROR:", error);
    return error.response || { status: 500, data: { message: "Server Error" } };
  }
};
