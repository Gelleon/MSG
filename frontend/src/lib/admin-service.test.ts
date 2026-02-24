import { adminService } from './admin-service';
import api from './api';

jest.mock('./api');

describe('adminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch users with params', async () => {
      const mockResponse = { data: { data: [], total: 0 } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10 };
      const result = await adminService.getUsers(params);

      expect(api.get).toHaveBeenCalledWith('/users/search', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = { email: 'test@test.com', password: 'password' };
      const mockResponse = { data: { id: '1', ...userData } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminService.createUser(userData);

      expect(api.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
