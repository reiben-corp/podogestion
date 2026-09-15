/**
 * Hook personalizado para gestionar la autenticación.
 * Usa Zustand para estado global.
 */
import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // OAuth2 usa form-data, no JSON
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await apiClient.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      set({ token: access_token, isLoading: false });
      
      // Obtener datos del usuario
      await get().checkAuth();
      
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || 'Error al iniciar sesión',
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));
