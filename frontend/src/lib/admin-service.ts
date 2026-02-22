import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  positionId?: string;
  createdAt?: string;
}

export const adminService = {
  // Use search endpoint which is accessible to authenticated users
  async getUsers(params?: { search?: string; limit?: number }) {
    const response = await api.get<User[]>('/users/search', { params });
    // Response is array of users directly
    return { data: response.data };
  },
  
  async updateUser(id: string, data: Partial<User>) {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  }
};
