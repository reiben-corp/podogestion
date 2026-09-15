/**
 * Cliente HTTP centralizado usando Axios.
 * Incluye interceptores para añadir el token JWT automáticamente.
 */
import axios, { AxiosInstance } from 'axios';

// Cliente API estándar (baseURL: /api)
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente para documentos (baseURL vacía para rutas /documentos que pasan por proxy)
export const documentosApi = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

setupInterceptors(apiClient);
setupInterceptors(documentosApi);

export default apiClient;
