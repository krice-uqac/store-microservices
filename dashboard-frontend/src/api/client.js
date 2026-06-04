import axios from 'axios';

export const AUTH_URL = 'http://localhost:8000';
export const INVENTORY_URL = 'http://localhost:8001';

export const authApi = axios.create({baseURL: AUTH_URL})
export const inventoryApi = axios.create({baseURL: INVENTORY_URL})

inventoryApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});