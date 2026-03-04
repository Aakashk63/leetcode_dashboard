import axios from 'axios';

const api = axios.create({
    baseURL: "https://leetcode-dashboard.onrender.com/api"
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
