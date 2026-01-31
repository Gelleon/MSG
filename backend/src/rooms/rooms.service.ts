import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway
  ) {}

  async validateRoomName(name: string, excludeRoomId?: string) {
    if (!name || !name.trim()) {
      throw new Error('Название комнаты не может быть пустым');
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      throw new Error('Название комнаты слишком длинное (максимум 100 символов)');
    }

    // Check for uniqueness (case insensitive approach for better UX, or strict as per prompt)
    // Prompt says "sensitive to register check".
    // "Реализуйте чувствительную к регистру проверку дубликатов" -> strict equality.
    // So "Room" and "room" are different.
    const existing = await this.prisma.room.findFirst({
      where: {
        name: {
          equals: trimmedName,
          // not specifying mode: 'insensitive' makes it sensitive (default depending on DB collation, but usually sensitive in Prisma/SQLite default)
        },
        id: excludeRoomId ? { not: excludeRoomId } : undefined,
      },
    });

    if (existing) {
      throw new Error('Комната с таким названием уже существует');
    }

    return trimmedName;
  }

  async create(data: Prisma.RoomUncheckedCreateInput) {
    const validatedName = await this.validateRoomName(data.name);
    try {
      return await this.prisma.room.create({
        data: {
          ...data,
          name: validatedName,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         throw new Error('Комната с таким названием уже существует');
      }
      throw error;
    }
  }

  async findAll(projectId?: string, user?: any) {
    // Filter by project if provided
    const where: Prisma.RoomWhereInput = projectId ? { projectId } : {};

    if (user && user.role === 'CLIENT') {
      where.members = {
        some: {
          userId: user.userId,
        },
      };
    }

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        parentRoom: true, // Include parent room details
        members: {
          include: {
            user: true,
          },
        },
      } as any,
    });

    const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
      let unreadCount = 0;
      if (user) {
        const member = (room as any).members.find((m: any) => m.userId === user.userId);
        if (member) {
          unreadCount = await this.prisma.message.count({
            where: {
              roomId: room.id,
              createdAt: { gt: member.lastReadAt },
            },
          });
        }
      }
      return {
        ...room,
        users: (room as any).members.map((m: any) => m.user),
        unreadCount,
      };
    }));

    return roomsWithCounts;
  }

  async markAsRead(roomId: string, userId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (member) {
      await this.prisma.roomMember.update({
        where: {
          id: member.id,
        },
        data: {
          lastReadAt: new Date(),
        },
      });
    }
  }

  async findOne(id: string, user?: any) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        parentRoom: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) return null;

    // If user is CLIENT, check if they are member
    if (user && user.role === 'CLIENT') {
       const isMember = room.members.some(m => m.userId === user.userId);
       if (!isMember) return null;
    }

    let messageWhere: Prisma.MessageWhereInput = { roomId: id };

    if (user && user.role === 'CLIENT') {
      const membership = room.members.find((m) => m.userId === user.userId);
      if (membership) {
        messageWhere.createdAt = {
          gte: membership.joinedAt,
        };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: messageWhere,
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...room,
      users: room.members.map((m) => m.user),
      messages,
    };
  }

  async delete(id: string) {
    // Delete related ActionLogs first since they don't cascade in schema
    // Using transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      await tx.actionLog.deleteMany({
        where: { roomId: id },
      });
      return tx.room.delete({
        where: { id },
      });
    });
  }

  async closePrivateSession(roomId: string, adminId?: string) {
    const room = await this.findOne(roomId);
    if (!room) throw new Error('Room not found');

    // Perform all operations in a transaction for safety and rollback
    return this.prisma.$transaction(async (tx) => {
      // Create an audit log for the closure (persisted, not linked to room)
      await tx.actionLog.create({
        data: {
          action: 'CLOSE_PRIVATE_SESSION',
          details: `Private session ${room.name} (${roomId}) closed and deleted${adminId ? '' : ' by SYSTEM'}`,
          adminId: adminId || null,
        },
      });

      // Delete related ActionLogs linked to this room
      await tx.actionLog.deleteMany({
        where: { roomId },
      });

      // Delete the room (cascades to messages, members, etc.)
      return tx.room.delete({
        where: { id: roomId },
      });
    });
  }

  async addUser(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is CLIENT and room is private
    if (room.isPrivate) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (user && user.role === 'CLIENT') {
        throw new Error('Clients cannot be added to private rooms');
      }
    }

    const isUserInRoom = room.members.some((member) => member.userId === userId);
    
    if (!isUserInRoom) {
      await this.prisma.roomMember.create({
        data: {
          roomId,
          userId,
        },
      });
    }

    // Return the full room object using findOne to ensure consistency
    return this.findOne(roomId);
  }

  async findInactivePrivateRooms(threshold: Date) {
    return this.prisma.room.findMany({
      where: {
        isPrivate: true,
        updatedAt: {
          lt: threshold,
        },
      },
    });
  }

  async addUsers(roomId: string, userIds: string[]) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Check if any user is CLIENT and room is private
    if (room.isPrivate) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds }
        }
      });
      
      const hasClient = users.some(u => u.role === 'CLIENT');
      if (hasClient) {
        throw new Error('Clients cannot be added to private rooms');
      }
    }

    const existingMemberIds = new Set(room.members.map(m => m.userId));
    const newMembers = userIds.filter(id => !existingMemberIds.has(id));

    if (newMembers.length > 0) {
      await this.prisma.roomMember.createMany({
        data: newMembers.map(userId => ({
          roomId,
          userId,
        })),
      });
    }

    return this.findOne(roomId);
  }

  async getMembers(roomId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomMemberWhereInput = {
      roomId,
    };

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      this.prisma.roomMember.count({ where }),
      this.prisma.roomMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: 'desc',
        },
      }),
    ]);

    return {
      data: members.map((m) => ({
        ...m.user,
        joinedAt: m.joinedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Prisma.RoomUpdateInput) {
    if (typeof data.name === 'string') {
      data.name = await this.validateRoomName(data.name, id);
    }
    
    try {
      return await this.prisma.room.update({
        where: { id },
        data,
      });
    } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new Error('Комната с таким названием уже существует');
       }
       throw error;
    }
  }

  async remove(id: string) {
    return this.delete(id);
  }

  async removeMember(roomId: string, userId: string, adminId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

      if (!member) {
        throw new Error('Member not found in room');
      }

      await tx.actionLog.create({
        data: {
          action: 'REMOVE_USER',
          details: reason || 'Member removed by admin',
          adminId,
          targetId: userId,
          roomId,
        },
      });

      await tx.roomMember.delete({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

      return { success: true };
    });
  }

  async getRoomLogs(roomId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.prisma.actionLog.count({ where: { roomId } }),
      this.prisma.actionLog.findMany({
        where: { roomId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: true,
          target: true,
        },
      }),
    ]);

    return {
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
