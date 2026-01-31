import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from './api';

interface User {
  id: string;
  username: string;
  name?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token: string) => {
        try {
          const decoded: any = jwtDecode(token);
          // Map backend payload to User interface if needed
          // Backend payload: { username: user.email, sub: user.id, role: user.role }
          const user: User = {
             id: decoded.sub,
             username: decoded.username,
             name: decoded.name,
             role: decoded.role
          };
          
          localStorage.setItem('token', token);
          set({ token, user });
        } catch (error) {
          console.error('Invalid token', error);
        }
      },
      register: async (username: string, email: string, password: string, name: string) => {
        await api.post('/auth/register', { username, email, password, name });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);
