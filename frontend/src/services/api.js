import axios from 'axios';

// Fast API method for automatic routing across Localhost, Network (LAN), and Internet
const getBaseUrl = () => {
    // 1. Internet (Production e.g., Vercel): Uses environment variable
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // 2. Localhost & Network (LAN): Dynamically uses the device's hostname/IP
    return `http://${window.location.hostname}:5000/api`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = (data) => api.post('/auth/login', data);
export const getLeaderboard = () => api.get('/leaderboard');
export const getStudent = (id) => api.get(`/student/${id}`);
export const addStudent = (data) => api.post('/student', data);
export const deleteStudent = (id) => api.delete(`/student/${id}`);
export const triggerUpdate = () => api.post('/update-all');

export default api;
