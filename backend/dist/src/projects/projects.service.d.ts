import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ProjectCreateInput): Promise<Project>;
    findAll(): Promise<Project[]>;
    findOne(id: string): Promise<Project | null>;
    update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project>;
    remove(id: string): Promise<Project>;
}
