import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from '../translation/translation.service';
import { FilesService } from '../files/files.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    room: {
      update: jest.fn(),
    },
    roomMember: {
      findUnique: jest.fn(),
    },
  };

  const mockTranslationService = {
    translateAuto: jest.fn(),
  };

  const mockFilesService = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: FilesService, useValue: mockFilesService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all messages for a room', async () => {
      const roomId = 'room-1';
      const messages = [{ id: 'msg-1', content: 'Hello', roomId }];
      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.findAll(roomId);

      expect(result).toEqual(messages);
      expect(prismaService.message.findMany).toHaveBeenCalledWith({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
      });
    });

    it('should restrict messages for CLIENT role based on join date', async () => {
      const roomId = 'room-1';
      const user = { userId: 'user-1', role: 'CLIENT', email: 'client@example.com' };
      const joinDate = new Date('2023-01-01');
      
      mockPrismaService.roomMember.findUnique.mockResolvedValue({
        joinedAt: joinDate,
      });
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(roomId, user);

      expect(prismaService.roomMember.findUnique).toHaveBeenCalled();
      expect(prismaService.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          roomId,
          createdAt: { gte: joinDate },
        },
      }));
    });

    it('should NOT restrict messages for Super Admin even if role is CLIENT', async () => {
      const roomId = 'room-1';
      const user = { userId: 'user-1', role: 'CLIENT', email: 'pallermo72@gmail.com' };
      
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(roomId, user);

      // Should NOT call roomMember.findUnique because Super Admin bypasses the check
      expect(prismaService.roomMember.findUnique).not.toHaveBeenCalled(); 
      
      // Should query without createdAt constraint
      expect(prismaService.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { roomId },
      }));
    });
  });
});
