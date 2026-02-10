import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { InvitationsService } from '../invitations/invitations.service';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;
  let prismaService: PrismaService;
  let invitationsService: InvitationsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let chatGateway: ChatGateway;

  const mockPrismaService: any = {
    room: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    roomMember: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    actionLog: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    $queryRaw: jest.fn(),
  };

  const mockChatGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  const mockInvitationsService = {
    validateAndAccept: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ChatGateway,
          useValue: mockChatGateway,
        },
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prismaService = module.get<PrismaService>(PrismaService);
    chatGateway = module.get<ChatGateway>(ChatGateway);
    invitationsService = module.get<InvitationsService>(InvitationsService);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRoomName', () => {
    it('should throw error if name is empty', async () => {
      await expect(service.validateRoomName('')).rejects.toThrow(
        'Название комнаты не может быть пустым',
      );
      await expect(service.validateRoomName('   ')).rejects.toThrow(
        'Название комнаты не может быть пустым',
      );
    });

    it('should throw error if name is too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(service.validateRoomName(longName)).rejects.toThrow(
        'Название комнаты слишком длинное (максимум 100 символов)',
      );
    });

    it('should throw error if room with same name exists', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'Existing Room',
      });
      await expect(service.validateRoomName('Existing Room')).rejects.toThrow(
        'Комната с таким названием уже существует',
      );
      expect(mockPrismaService.room.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'Existing Room' },
          id: undefined,
        },
      });
    });

    it('should pass if name is valid and unique', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue(null);
      const result = await service.validateRoomName('New Room');
      expect(result).toBe('New Room');
      expect(mockPrismaService.room.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'New Room' },
          id: undefined,
        },
      });
    });

    it('should exclude current room ID when checking uniqueness', async () => {
      mockPrismaService.room.findFirst.mockResolvedValue(null);
      await service.validateRoomName('My Room', 'current-id');
      expect(mockPrismaService.room.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'My Room' },
          id: { not: 'current-id' },
        },
      });
    });
  });

  describe('create', () => {
    it('should create room successfully', async () => {
      const createDto: Prisma.RoomUncheckedCreateInput = {
        name: 'New Room',
        description: 'Test',
      };
      mockPrismaService.room.findFirst.mockResolvedValue(null); // Validation pass
      mockPrismaService.room.create.mockResolvedValue({
        id: 'new-id',
        ...createDto,
      });

      const result = await service.create(createDto);
      expect(result).toEqual({ id: 'new-id', ...createDto });
      expect(mockPrismaService.room.create).toHaveBeenCalled();
    });

    it('should throw error if P2002 error occurs', async () => {
      const createDto: Prisma.RoomUncheckedCreateInput = { name: 'New Room' };
      mockPrismaService.room.findFirst.mockResolvedValue(null); // Validation pass

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockPrismaService.room.create.mockRejectedValue(p2002Error);

      await expect(service.create(createDto)).rejects.toThrow(
        'Комната с таким названием уже существует',
      );
    });

    it('should rethrow other errors', async () => {
      const createDto: Prisma.RoomUncheckedCreateInput = { name: 'New Room' };
      mockPrismaService.room.findFirst.mockResolvedValue(null);
      mockPrismaService.room.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createDto)).rejects.toThrow('DB Error');
    });
  });

  describe('update', () => {
    it('should update room name successfully', async () => {
      const updateDto: Prisma.RoomUpdateInput = { name: 'Updated Room' };
      mockPrismaService.room.findFirst.mockResolvedValue(null); // Validation pass
      mockPrismaService.room.update.mockResolvedValue({
        id: 'room-id',
        name: 'Updated Room',
      });

      const result = await service.update('room-id', updateDto);
      expect(result).toEqual({ id: 'room-id', name: 'Updated Room' });
      expect(mockPrismaService.room.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'Updated Room' },
          id: { not: 'room-id' },
        },
      });
    });

    it('should throw error on P2002 during update', async () => {
      const updateDto: Prisma.RoomUpdateInput = { name: 'Updated Room' };
      mockPrismaService.room.findFirst.mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockPrismaService.room.update.mockRejectedValue(p2002Error);

      await expect(service.update('room-id', updateDto)).rejects.toThrow(
        'Комната с таким названием уже существует',
      );
    });

    it('should update room description successfully', async () => {
      const updateDto: Prisma.RoomUpdateInput = { description: 'New Description' };
      mockPrismaService.room.update.mockResolvedValue({
        id: 'room-id',
        name: 'Existing Name',
        description: 'New Description',
      });

      const result = await service.update('room-id', updateDto);
      expect(result).toEqual({ id: 'room-id', name: 'Existing Name', description: 'New Description' });
      expect(mockPrismaService.room.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.room.update).toHaveBeenCalledWith({
        where: { id: 'room-id' },
        data: updateDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return rooms with unread counts', async () => {
      const user = { userId: 'user-1', role: 'USER' };
      const rooms = [
        {
          id: 'room-1',
          members: [{ userId: 'user-1', lastReadAt: new Date('2023-01-01') }],
        },
      ];
      mockPrismaService.room.findMany.mockResolvedValue(rooms);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { roomId: 'room-1', count: BigInt(5) }
      ]);

      const result = await service.findAll(undefined, user);

      expect(result).toHaveLength(1);
      expect(result[0].unreadCount).toBe(5);
      expect(mockPrismaService.room.findMany).toHaveBeenCalled();
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should filter by project if provided', async () => {
      await service.findAll('project-1');
      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-1' },
        }),
      );
    });

    it('should filter for CLIENT role', async () => {
      const user = { userId: 'client-1', role: 'CLIENT' };
      mockPrismaService.room.findMany.mockResolvedValue([]);

      await service.findAll(undefined, user);

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: { userId: 'client-1' },
            },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return room details', async () => {
      const room = { id: 'room-1', members: [{ user: { id: 'user-1' } }] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockPrismaService.message.findMany.mockResolvedValue([]);

      const result = await service.findOne('room-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('room-1');
    });

    it('should return null if room not found', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);
      const result = await service.findOne('room-1');
      expect(result).toBeNull();
    });

    it('should return null if CLIENT is not a member', async () => {
      const room = { id: 'room-1', members: [{ userId: 'user-2' }] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      const user = { userId: 'client-1', role: 'CLIENT' };

      const result = await service.findOne('room-1', user);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete room and logs', async () => {
      mockPrismaService.actionLog.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.room.delete.mockResolvedValue({ id: 'room-1' });

      await service.delete('room-1');

      expect(mockPrismaService.actionLog.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.room.delete).toHaveBeenCalled();
    });

    it('should call delete via remove alias', async () => {
      mockPrismaService.actionLog.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.room.delete.mockResolvedValue({ id: 'room-1' });

      await service.remove('room-1');
      expect(mockPrismaService.room.delete).toHaveBeenCalled();
    });
  });

  describe('closePrivateSession', () => {
    it('should close private session and log action', async () => {
      const room = { id: 'room-1', name: 'Private Room' };
      // Reuse findUnique from findOne inside closePrivateSession
      // But closePrivateSession calls this.findOne which calls prisma.room.findUnique
      // We need to mock service.findOne or just mock prisma responses that findOne uses.
      // Since we are testing service, we should stick to mocking prisma.

      // findOne implementation calls prisma.room.findUnique then prisma.message.findMany
      mockPrismaService.room.findUnique.mockResolvedValue({
        ...room,
        members: [],
      });
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.closePrivateSession('room-1', 'admin-1');

      expect(mockPrismaService.actionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CLOSE_PRIVATE_SESSION',
            adminId: 'admin-1',
          }),
        }),
      );
      expect(mockPrismaService.room.delete).toHaveBeenCalled();
    });
  });

  describe('addUser', () => {
    it('should add user to room', async () => {
      const room = { id: 'room-1', isPrivate: false, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockPrismaService.roomMember.create.mockResolvedValue({});
      // Mock findOne for return
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.addUser('room-1', 'user-1');

      expect(mockPrismaService.roomMember.create).toHaveBeenCalled();
    });

    it('should throw if room not found', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);
      await expect(service.addUser('room-1', 'user-1')).rejects.toThrow(
        'Room not found',
      );
    });

    it('should throw if adding CLIENT to private room', async () => {
      const room = { id: 'room-1', isPrivate: true, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'client-1',
        role: 'CLIENT',
      });

      await expect(service.addUser('room-1', 'client-1')).rejects.toThrow(
        'Clients cannot be added to private rooms',
      );
    });

    it('should not create membership if user already in room', async () => {
      const room = { 
        id: 'room-1', 
        isPrivate: false, 
        members: [{ userId: 'user-1' }] 
      };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      // Mock findOne dependencies
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.addUser('room-1', 'user-1');

      expect(mockPrismaService.roomMember.create).not.toHaveBeenCalled();
    });

    it('should throw if room is full', async () => {
      const room = { 
        id: 'room-1', 
        isPrivate: false, 
        members: Array(1000).fill({ userId: 'other' }) 
      };
      mockPrismaService.room.findUnique.mockResolvedValue(room);

      await expect(service.addUser('room-1', 'user-1')).rejects.toThrow('Room is full');
    });

    it('should join with valid invitation code', async () => {
      const room = { id: 'room-1', isPrivate: true, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockInvitationsService.validateAndAccept.mockResolvedValue({ roomId: 'room-1' });
      // Mock findOne for return
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.addUser('room-1', 'client-1', 'valid-code');

      expect(mockInvitationsService.validateAndAccept).toHaveBeenCalledWith('valid-code', 'client-1');
      // Should NOT call roomMember.create because validateAndAccept handles it
      expect(mockPrismaService.roomMember.create).not.toHaveBeenCalled();
    });

    it('should throw if invitation code is for different room', async () => {
      const room = { id: 'room-1', isPrivate: true, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockInvitationsService.validateAndAccept.mockResolvedValue({ roomId: 'other-room' });

      await expect(service.addUser('room-1', 'client-1', 'valid-code')).rejects.toThrow('Invitation code is for a different room');
    });

    it('should throw if invitation code is invalid', async () => {
      const room = { id: 'room-1', isPrivate: true, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockInvitationsService.validateAndAccept.mockRejectedValue(new Error('Invalid token'));

      await expect(service.addUser('room-1', 'client-1', 'invalid-code')).rejects.toThrow('Invalid token');
    });
  });

  describe('addUsers', () => {
    it('should add multiple users', async () => {
      const room = { id: 'room-1', isPrivate: false, members: [] };
      mockPrismaService.room.findUnique.mockResolvedValue(room);
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.addUsers('room-1', ['user-1', 'user-2']);

      expect(mockPrismaService.roomMember.createMany).toHaveBeenCalled();
    });

    it('should throw if room capacity exceeded', async () => {
      const room = { 
        id: 'room-1', 
        isPrivate: false, 
        members: Array(999).fill({ userId: 'other' }) 
      };
      mockPrismaService.room.findUnique.mockResolvedValue(room);

      await expect(service.addUsers('room-1', ['user-1', 'user-2'])).rejects.toThrow('Room capacity exceeded');
    });
  });

  describe('removeMember', () => {
    it('should remove member and log action', async () => {
      mockPrismaService.roomMember.findUnique.mockResolvedValue({
        id: 'member-1',
      });

      await service.removeMember('room-1', 'user-1', 'admin-1');

      expect(mockPrismaService.actionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REMOVE_USER',
            targetId: 'user-1',
          }),
        }),
      );
      expect(mockPrismaService.roomMember.delete).toHaveBeenCalled();
    });
  });

  describe('getMembers', () => {
    it('should return members with pagination', async () => {
      mockPrismaService.roomMember.count.mockResolvedValue(10);
      mockPrismaService.roomMember.findMany.mockResolvedValue([
        { user: { id: 'user-1' }, joinedAt: new Date() },
      ]);

      const result = await service.getMembers('room-1', { page: 1, limit: 10 });

      expect(result.total).toBe(10);
      expect(result.data).toHaveLength(1);
    });

    it('should deny access to private room if user is not member', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue({ id: 'room-1', isPrivate: true });
      mockPrismaService.roomMember.findFirst.mockResolvedValue(null); // Not a member

      await expect(
        service.getMembers(
          'room-1',
          { page: 1, limit: 10 },
          { userId: 'user-2', role: 'USER' },
        ),
      ).rejects.toThrow('Access denied');
    });

    it('should allow access to private room if user is member', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue({ id: 'room-1', isPrivate: true });
      mockPrismaService.roomMember.findFirst.mockResolvedValue({ userId: 'user-1' }); // Is member
      mockPrismaService.roomMember.count.mockResolvedValue(10);
      mockPrismaService.roomMember.findMany.mockResolvedValue([
        { user: { id: 'user-1' }, joinedAt: new Date() },
      ]);

      const result = await service.getMembers(
        'room-1',
        { page: 1, limit: 10 },
        { userId: 'user-1', role: 'USER' },
      );

      expect(result.total).toBe(10);
    });
  });

  describe('markAsRead', () => {
    it('should update lastReadAt', async () => {
      mockPrismaService.roomMember.findUnique.mockResolvedValue({
        id: 'member-1',
      });

      await service.markAsRead('room-1', 'user-1');

      expect(mockPrismaService.roomMember.update).toHaveBeenCalled();
    });
  });

  describe('findInactivePrivateRooms', () => {
    it('should find inactive rooms', async () => {
      const date = new Date();
      await service.findInactivePrivateRooms(date);
      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPrivate: true,
            updatedAt: { lt: date },
          },
        }),
      );
    });
  });

  describe('getRoomLogs', () => {
    it('should return logs', async () => {
      mockPrismaService.actionLog.count.mockResolvedValue(5);
      mockPrismaService.actionLog.findMany.mockResolvedValue([]);

      const result = await service.getRoomLogs('room-1', 1, 10);
      expect(result.total).toBe(5);
    });
  });

  describe('changeUserRole', () => {
    it('should change user role and log action', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });

      const result = await service.changeUserRole('room-1', 'user-1', 'ADMIN', 'admin-1', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(result.role).toBe('ADMIN');
      expect(mockPrismaService.actionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ROLE_CHANGED',
            previousRole: 'CLIENT',
            newRole: 'ADMIN',
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        }),
      );
    });

    it('should not update if role is same', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });

      await service.changeUserRole('room-1', 'user-1', 'ADMIN', 'admin-1');

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeUserRole('room-1', 'user-1', 'ADMIN', 'admin-1'),
      ).rejects.toThrow('User not found');
    });
  });
});
