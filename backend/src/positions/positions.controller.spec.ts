import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { BadRequestException } from '@nestjs/common';

const mockPositionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  assignToUsers: jest.fn(),
  unassignFromUsers: jest.fn(),
};

describe('PositionsController', () => {
  let controller: PositionsController;
  let service: PositionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [
        {
          provide: PositionsService,
          useValue: mockPositionsService,
        },
      ],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
    service = module.get<PositionsService>(PositionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a position', async () => {
      const dto: CreatePositionDto = { nameRu: 'Test', nameZh: 'Test' };
      mockPositionsService.create.mockResolvedValue({ id: '1', ...dto });

      expect(await controller.create(dto)).toEqual({ id: '1', ...dto });
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of positions', async () => {
      const result = [{ id: '1', nameRu: 'Test', nameZh: 'Test' }];
      mockPositionsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toEqual(result);
    });
  });

  describe('findOne', () => {
    it('should return a position', async () => {
      const result = { id: '1', nameRu: 'Test', nameZh: 'Test' };
      mockPositionsService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1')).toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a position', async () => {
      const dto: UpdatePositionDto = { nameRu: 'Updated' };
      mockPositionsService.update.mockResolvedValue({ id: '1', ...dto });

      expect(await controller.update('1', dto)).toEqual({ id: '1', ...dto });
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should remove a position', async () => {
      mockPositionsService.remove.mockResolvedValue({ id: '1' });

      expect(await controller.remove('1')).toEqual({ id: '1' });
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('assignToUsers', () => {
    it('should assign position to users', async () => {
      mockPositionsService.assignToUsers.mockResolvedValue({ count: 2 });
      
      const body = { userIds: ['1', '2'] };
      expect(await controller.assignToUsers('pos1', body)).toEqual({ count: 2 });
      expect(service.assignToUsers).toHaveBeenCalledWith('pos1', ['1', '2']);
    });

    it('should throw BadRequestException if userIds is invalid', async () => {
      await expect(controller.assignToUsers('pos1', { userIds: [] })).rejects.toThrow(BadRequestException);
      await expect(controller.assignToUsers('pos1', { userIds: null as any })).rejects.toThrow(BadRequestException);
    });
  });
});
