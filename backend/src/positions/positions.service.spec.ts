import { Test, TestingModule } from '@nestjs/testing';
import { PositionsService } from './positions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  position: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    updateMany: jest.fn(),
  },
};

describe('PositionsService', () => {
  let service: PositionsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a position', async () => {
      const dto = { nameRu: 'Менеджер', nameZh: 'Manager' };
      mockPrismaService.position.create.mockResolvedValue({ id: '1', ...dto });

      expect(await service.create(dto)).toEqual({ id: '1', ...dto });
      expect(prisma.position.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('findAll', () => {
    it('should return an array of positions', async () => {
      const result = [{ id: '1', nameRu: 'Менеджер', nameZh: 'Manager', users: [] }];
      mockPrismaService.position.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toEqual(result);
    });
  });

  describe('findOne', () => {
    it('should return a position if found', async () => {
      const result = { id: '1', nameRu: 'Test', nameZh: 'Test', users: [] };
      mockPrismaService.position.findUnique.mockResolvedValue(result);

      expect(await service.findOne('1')).toEqual(result);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.position.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
  
  describe('assignToUsers', () => {
    it('should assign position to users', async () => {
        mockPrismaService.position.findUnique.mockResolvedValue({ id: 'pos1' });
        mockPrismaService.user.updateMany.mockResolvedValue({ count: 2 });
        
        const result = await service.assignToUsers('pos1', ['user1', 'user2']);
        expect(result).toEqual({ count: 2 });
        expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ['user1', 'user2'] } },
            data: { positionId: 'pos1' }
        });
    });

    it('should throw if position not found', async () => {
        mockPrismaService.position.findUnique.mockResolvedValue(null);
        
        await expect(service.assignToUsers('pos999', ['user1'])).rejects.toThrow(NotFoundException);
    });
  });
});
