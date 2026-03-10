import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? "http://localhost:5000/api" : "https://leetcode-dashboard.onrender.com/api";

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = (data) => api.post('/auth/login', data);
export const getLeaderboard = () => api.get('/students/leaderboard');
export const getStudent = (id) => api.get(`/students/student/${id}`);
export const getStudentProfile = (username) => api.get(`/students/profile/${username}`);
export const addStudent = (data) => api.post('/students/student', data);
export const deleteStudent = (id) => api.delete(`/students/student/${id}`);
export const getDailyActivity = (date) => api.get(`/students/daily-activity?date=${date}`);
export const triggerUpdate = () => api.post('/students/update-all');

export default api;
