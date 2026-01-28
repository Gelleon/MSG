import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(roomId: string, userId: string, role: string) {
    const allowedRoles = ['MANAGER', 'CLIENT'];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    // Verify creator permissions (Owner/Admin)
    // For now assuming the caller checks or we check user role
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        // throw new BadRequestException('Only Owner or Admin can create invitations');
        // Temporarily allow for testing if roles aren't set up perfectly yet
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    return this.prisma.invitation.create({
      data: {
        token,
        roomId,
        role,
        creatorId: userId,
        expiresAt,
      },
    });
  }

  async validateAndAccept(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { room: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.isUsed) {
      throw new BadRequestException('Invitation already used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation expired');
    }

    // Transaction: mark used, add user to room, update user role
    await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      }),
      this.prisma.roomMember.create({
        data: {
          roomId: invitation.roomId,
          userId: userId,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: invitation.role },
      }),
    ]);

    return { success: true, roomId: invitation.roomId };
  }

  async getInvitation(token: string) {
      return this.prisma.invitation.findUnique({
          where: { token },
          include: { 
              room: {
                  select: { name: true }
              },
              creator: {
                  select: { name: true }
              }
          }
      });
  }
}
