import api from './api';

export interface Position {
  id: string;
  nameRu: string;
  nameZh: string;
  createdAt: string;
  updatedAt: string;
  users?: {
    id: string;
    name: string;
    email: string;
  }[];
}

export interface CreatePositionDto {
  nameRu: string;
  nameZh: string;
}

export interface UpdatePositionDto {
  nameRu?: string;
  nameZh?: string;
}

export const positionsService = {
  async getAll() {
    const response = await api.get<Position[]>('/positions');
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<Position>(`/positions/${id}`);
    return response.data;
  },

  async create(data: CreatePositionDto) {
    const response = await api.post<Position>('/positions', data);
    return response.data;
  },

  async update(id: string, data: UpdatePositionDto) {
    const response = await api.patch<Position>(`/positions/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/positions/${id}`);
  },

  async assignToUsers(positionId: string, userIds: string[]) {
    const response = await api.post(`/positions/${positionId}/assign`, { userIds });
    return response.data;
  },
  
  async unassignFromUsers(userIds: string[]) {
    const response = await api.post(`/positions/unassign`, { userIds });
    return response.data;
  }
};
