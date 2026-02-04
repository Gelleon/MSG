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

      expect(result).toEqual(messages.reverse());
      expect(prismaService.message.findMany).toHaveBeenCalledWith({
        where: { roomId, deletedAt: null },
        take: 50,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          sender: true,
          replyTo: {
            include: {
              sender: true,
            },
          },
        },
      });
    });

    it('should not restrict messages for CLIENT role by join date', async () => {
      const roomId = 'room-1';
      const user = {
        userId: 'user-1',
        role: 'CLIENT',
        email: 'client@example.com',
      };
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(roomId, user);

      expect(prismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            roomId,
            deletedAt: null,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('should NOT restrict messages for Super Admin even if role is CLIENT', async () => {
      const roomId = 'room-1';
      const user = {
        userId: 'user-1',
        role: 'CLIENT',
        email: 'pallermo72@gmail.com',
      };

      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(roomId, user);

      // Should NOT call roomMember.findUnique because Super Admin bypasses the check
      expect(prismaService.roomMember.findUnique).not.toHaveBeenCalled();

      // Should query without createdAt constraint
      expect(prismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId, deletedAt: null },
        }),
      );
    });

    it('should load older messages based on cursor', async () => {
      const roomId = 'room-1';
      const cursorId = 'msg-2';
      const cursorMessage = {
        id: cursorId,
        roomId,
        createdAt: new Date('2024-01-02T10:00:00Z'),
      };

      mockPrismaService.message.findUnique.mockResolvedValue(cursorMessage);
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.findAll(roomId, undefined, cursorId, 50);

      expect(prismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roomId,
            deletedAt: null,
            OR: [
              { createdAt: { lt: cursorMessage.createdAt } },
              {
                createdAt: cursorMessage.createdAt,
                id: { lt: cursorMessage.id },
              },
            ],
          }),
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });
  });
});
