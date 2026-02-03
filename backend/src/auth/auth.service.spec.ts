import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUsersService = {
  findOne: jest.fn(),
  createUser: jest.fn(),
  setResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        username: 'ignored_username', // Should be ignored
      };

      const createdUser = {
        id: 'user-id',
        email: dto.email,
        password: 'hashedpassword',
        name: dto.name,
        role: 'CLIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(createdUser);

      const result = await service.register(dto as any);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(dto.email);
      expect(mockUsersService.createUser).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: 'CLIENT',
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toEqual(dto.email);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUsersService.findOne.mockResolvedValue({
        id: 'existing-id',
        email: dto.email,
      });

      await expect(service.register(dto as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should handle registration errors gracefully', async () => {
      const dto = {
        email: 'error@example.com',
        password: 'password123',
      };

      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.createUser.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.register(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'CLIENT',
        name: 'Test User',
      };
      const token = 'generated-token';

      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
        role: user.role,
        name: user.name,
      });
      expect(result).toEqual({ access_token: token });
    });
  });
});
