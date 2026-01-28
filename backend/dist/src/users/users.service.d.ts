import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(email: string): Promise<User | null>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    findById(id: string): Promise<User | null>;
    findAll(params?: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<{
        data: User[];
        total: number;
    }>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    delete(id: string): Promise<User>;
    deleteMany(ids: string[]): Promise<Prisma.BatchPayload>;
}
