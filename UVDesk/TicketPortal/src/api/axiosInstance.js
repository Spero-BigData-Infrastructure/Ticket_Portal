import axios from "axios";
import { toast } from "react-toastify"; // 🔥 Import Toast
import { API_URL } from "../config/api";

// 1. Create an Axios instance with the Base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. RESPONSE INTERCEPTOR (Handle Errors Here)
axiosInstance.interceptors.response.use(
  (response) => {
    // If the response is successful, just return it
    return response;
  },
  (error) => {
    // Extract the error message from the backend response or use a default message
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong while fetching data!";

    // 🔥 1. Log the error to the console for developers
    console.error("🚨 API Error Response:", errorMessage);

    // 🔥 2. Show a Toast Notification for the user
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });

    // Handle unauthorized access (e.g., Token expired)
    if (error.response && error.response.status === 401) {
      toast.info("Session expired. Please login again.");
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
