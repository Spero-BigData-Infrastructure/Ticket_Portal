import axios from "axios";

// 1. Axios ka instance create karo Base URL ke sath
const axiosInstance = axios.create({
  baseURL: "http://192.168.1.204:8558/api", // Baar-baar pura URL nahi likhna padega
  timeout: 10000, // Agar API 10 second mein response na de toh error de dega
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. REQUEST INTERCEPTOR (API call hone se theek pehle kya karna hai)
axiosInstance.interceptors.request.use(
  (config) => {
    // Agar aapke paas login token hai (localStorage/Cookies me), toh yahan se bhej sakte ho:
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. RESPONSE INTERCEPTOR (API ka response aane ke theek baad kya karna hai)
axiosInstance.interceptors.response.use(
  (response) => {
    // Response successful hai toh seedha data return kardo
    return response;
  },
  (error) => {
    // Agar error aaye (e.g., 401 Unauthorized, 500 Server Error) toh global alert dikha sakte ho
    console.error("API Error Response:", error.response?.data || error.message);

    if (error.response && error.response.status === 401) {
      // User ka token expire ho gaya hai, usko login page pe bhej do
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
