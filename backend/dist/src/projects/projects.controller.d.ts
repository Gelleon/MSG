import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(req: any, createProjectDto: Prisma.ProjectCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    } | null>;
    update(id: string, updateProjectDto: Prisma.ProjectUpdateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
}
