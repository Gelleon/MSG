import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
    });
  }

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      include: {
        owner: true,
        rooms: true,
      },
    });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        rooms: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
