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

  async create(data: Prisma.RoomUncheckedCreateInput) {
    return this.prisma.room.create({
      data,
    });
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
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
      let unreadCount = 0;
      if (user) {
        const member = room.members.find((m) => m.userId === user.userId);
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
        users: room.members.map((m) => m.user),
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
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) return null;

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

  async addUser(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      throw new Error('Room not found');
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

  async addUsers(roomId: string, userIds: string[]) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    const newMembers = userIds.filter(userId => 
      !room.members.some(member => member.userId === userId)
    );

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

  async update(id: string, data: Prisma.RoomUpdateInput) {
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.room.delete({
      where: { id },
    });
  }

  async removeMember(roomId: string, userId: string, adminId: string, reason?: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      include: { user: true },
    });

    if (!member) {
      throw new Error('Member not found in room');
    }

    await this.prisma.roomMember.delete({
      where: {
        id: member.id,
      },
    });

    await this.prisma.actionLog.create({
      data: {
        action: 'REMOVE_USER',
        details: reason || 'No reason provided',
        adminId,
        targetId: userId,
        roomId,
      },
    });

    this.chatGateway.server.to(roomId).emit('userRemoved', {
      userId,
      userName: member.user.name,
      reason,
      roomId,
    });

    return member.user;
  }

  async getMembers(roomId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomMemberWhereInput = {
      roomId,
      user: search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      } : undefined
    };

    const [total, members] = await Promise.all([
      this.prisma.roomMember.count({ where }),
      this.prisma.roomMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              // We don't have online status in DB, so we'll handle it via gateway/cache if needed, 
              // or just return static data for now.
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      })
    ]);

    return {
      data: members.map(m => ({
        ...m.user,
        joinedAt: m.joinedAt,
        // Mock status for now, ideally fetched from a presence service
        status: 'offline' 
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getRoomLogs(roomId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.actionLog.findMany({
        where: { roomId },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          target: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.actionLog.count({ where: { roomId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
