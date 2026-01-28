import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
export declare class UsersController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    findAll(page: string | undefined, limit: string | undefined, search: string | undefined, sortBy: string | undefined, sortOrder: "asc" | "desc" | undefined, req: any): Promise<{
        data: import(".prisma/client").User[];
        total: number;
    }>;
    create(createUserDto: Prisma.UserCreateInput, req: any): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    exportUsers(res: any, req: any): Promise<void>;
    getProfile(req: any): any;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, updateUserDto: Prisma.UserUpdateInput, req: any): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeMany(body: {
        ids: string[];
    }, req: any): Promise<Prisma.BatchPayload>;
}
