import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';
export declare class RoomsService {
    private prisma;
    private chatGateway;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    create(data: Prisma.RoomUncheckedCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    }>;
    findAll(projectId?: string, user?: any): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        unreadCount: number;
        members: ({
            user: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            joinedAt: Date;
            lastReadAt: Date;
            roomId: string;
            userId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    }[]>;
    markAsRead(roomId: string, userId: string): Promise<void>;
    findOne(id: string, user?: any): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        messages: ({
            sender: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roomId: string;
            content: string | null;
            translations: string | null;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
            isPrivate: boolean;
            senderId: string;
        })[];
        members: ({
            user: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            joinedAt: Date;
            lastReadAt: Date;
            roomId: string;
            userId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    } | null>;
    addUser(roomId: string, userId: string): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        messages: ({
            sender: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roomId: string;
            content: string | null;
            translations: string | null;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
            isPrivate: boolean;
            senderId: string;
        })[];
        members: ({
            user: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            joinedAt: Date;
            lastReadAt: Date;
            roomId: string;
            userId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    } | null>;
    addUsers(roomId: string, userIds: string[]): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        messages: ({
            sender: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            roomId: string;
            content: string | null;
            translations: string | null;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
            isPrivate: boolean;
            senderId: string;
        })[];
        members: ({
            user: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            joinedAt: Date;
            lastReadAt: Date;
            roomId: string;
            userId: string;
        })[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    } | null>;
    update(id: string, data: Prisma.RoomUpdateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
    }>;
    removeMember(roomId: string, userId: string, adminId: string, reason?: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMembers(roomId: string, params: {
        page: number;
        limit: number;
        search?: string;
    }): Promise<{
        data: {
            joinedAt: Date;
            status: string;
            id: string;
            email: string;
            name: string | null;
            role: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getRoomLogs(roomId: string, page?: number, limit?: number): Promise<{
        data: ({
            target: {
                id: string;
                email: string;
                name: string | null;
            } | null;
            admin: {
                id: string;
                email: string;
                name: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roomId: string | null;
            targetId: string | null;
            action: string;
            details: string | null;
            adminId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
