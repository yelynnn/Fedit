import axios from "axios";

// const token = localStorage.getItem("jwtToken");

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
  headers: {
    // Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export { axiosInstance };
