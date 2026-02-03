import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    createUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      const result = { data: [], total: 0 };
      mockUsersService.findAll.mockResolvedValue(result);

      const req = { user: { userId: 'admin-id' } };
      expect(
        await controller.findAll('1', '10', '', 'createdAt', 'desc', req),
      ).toBe(result);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a user if email is unique', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password',
        role: 'CLIENT',
      };
      const req = { user: { userId: 'admin-id' } };

      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue({ id: '1', ...dto });

      expect(await controller.create(dto, req)).toEqual({ id: '1', ...dto });
    });

    it('should throw error if email exists', async () => {
      const dto = {
        email: 'existing@test.com',
        password: 'password',
        role: 'CLIENT',
      };
      const req = { user: { userId: 'admin-id' } };

      mockUsersService.findOne.mockResolvedValue({ id: '1', ...dto });

      await expect(controller.create(dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
