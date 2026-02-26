import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from './api';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  name?: string;
  role: string;
  emailNotificationsEnabled?: boolean;
  avatarUrl?: string;
  status?: 'ONLINE' | 'DND' | 'OFFLINE';
  lastSeen?: string;
  position?: {
    id: string;
    nameRu: string;
    nameZh: string;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, userData?: Partial<User>) => void;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token: string, userData?: Partial<User>) => {
        try {
          const decoded: any = jwtDecode(token);
          // Map backend payload to User interface if needed
          // Backend payload: { username: user.email, sub: user.id, role: user.role }
          const user: User = {
             id: decoded.sub,
             username: decoded.username,
             email: decoded.username, // username in token payload IS the email
             name: decoded.name,
             role: decoded.role,
             phone: decoded.phone,
             ...userData // Merge additional user data if provided
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
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);
