import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto) {
    return this.prisma.position.create({
      data: createPositionDto,
    });
  }

  async findAll() {
    return this.prisma.position.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return position;
  }

  async update(id: string, updatePositionDto: UpdatePositionDto) {
    try {
      return await this.prisma.position.update({
        where: { id },
        data: updatePositionDto,
      });
    } catch (error) {
      // Prisma error for record not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.position.delete({
        where: { id },
      });
    } catch (error) {
       if (error.code === 'P2025') {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }
      throw error;
    }
  }

  async assignToUsers(positionId: string, userIds: string[]) {
    // Check if position exists
    await this.findOne(positionId);

    // Update users
    return this.prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        positionId
      }
    });
  }
  
  async unassignFromUsers(userIds: string[]) {
    return this.prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        positionId: null
      }
    });
  }
}
