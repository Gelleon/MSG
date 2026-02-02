import api from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
}

export interface UserParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const adminService = {
  getUsers: async (params: UserParams) => {
    const response = await api.get<UsersResponse>('/users', { params });
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  exportUsers: async () => {
    const response = await api.get('/users/export', { responseType: 'blob' });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  deleteUsers: async (ids: string[]) => {
    const response = await api.delete('/users', { data: { ids } });
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  }
};
