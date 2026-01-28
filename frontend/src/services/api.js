import axios from 'axios';

// Базовий URL API
const API_URL = import.meta.env.VITE_API_URL;

// Створення екземпляра axios з базовими налаштуваннями
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерцептор для додавання токена авторизації (якщо потрібно)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Інтерцептор для обробки помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Сервер відповів зі статусом поза діапазоном 2xx
      console.error('API Error:', error.response.data);
      
      if (error.response.status === 401) {
        // Перенаправлення на сторінку авторизації
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Запит було зроблено, але відповіді не отримано
      console.error('Network Error:', error.request);
    } else {
      // Щось сталося під час налаштування запиту
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Функції для роботи з API
export const propertyAPI = {
  getAll: () => api.get('/properties'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getStats: () => api.get('/properties/dashboard/stats'),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: () => api.get('/transactions/summary'),
};

export const meterAPI = {
  getAll: (params) => api.get('/meters', { params }),
  getById: (id) => api.get(`/meters/${id}`),
  create: (data) => api.post('/meters', data),
  update: (id, data) => api.put(`/meters/${id}`, data),
  delete: (id) => api.delete(`/meters/${id}`),
  getLatest: (propertyId) => api.get(`/meters/latest/${propertyId}`),
};

export default api;