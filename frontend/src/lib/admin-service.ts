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
  },

  async createUser(data: Partial<User> & { password?: string }) {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  async exportUsers() {
    // For now, we'll simulate an export by getting all users and converting to CSV
    // Ideally, this should be an endpoint like /users/export
    const response = await api.get<User[]>('/users/search', { params: { limit: 1000 } });
    const users = response.data;
    
    // Convert to CSV
    const headers = ['id', 'name', 'email', 'role', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => headers.map(header => 
        // @ts-ignore
        JSON.stringify(user[header] || '')
      ).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },

  async deleteUsers(ids: string[]) {
    // Ideally this should be a bulk delete endpoint
    // For now we'll delete one by one
    await Promise.all(ids.map(id => api.delete(`/users/${id}`)));
  },

  async deleteUser(id: string) {
    await api.delete(`/users/${id}`);
  }
};
