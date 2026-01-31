import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';
export declare class RoomsService {
    private prisma;
    private chatGateway;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    validateRoomName(name: string, excludeRoomId?: string): Promise<string>;
    create(data: Prisma.RoomUncheckedCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
    findAll(projectId?: string, user?: any): Promise<{
        users: any;
        unreadCount: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
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
        parentRoom: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isPrivate: boolean;
            description: string | null;
            projectId: string | null;
            parentRoomId: string | null;
        } | null;
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
        parentRoomId: string | null;
    } | null>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
    closePrivateSession(roomId: string, adminId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
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
        parentRoom: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isPrivate: boolean;
            description: string | null;
            projectId: string | null;
            parentRoomId: string | null;
        } | null;
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
        parentRoomId: string | null;
    } | null>;
    findInactivePrivateRooms(threshold: Date): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }[]>;
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
        parentRoom: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isPrivate: boolean;
            description: string | null;
            projectId: string | null;
            parentRoomId: string | null;
        } | null;
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
        parentRoomId: string | null;
    } | null>;
    getMembers(roomId: string, params: {
        page: number;
        limit: number;
        search?: string;
    }): Promise<{
        data: {
            joinedAt: Date;
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    update(id: string, data: Prisma.RoomUpdateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
    removeMember(roomId: string, userId: string, adminId: string, reason?: string): Promise<{
        success: boolean;
    }>;
    getRoomLogs(roomId: string, page: number, limit: number): Promise<{
        data: ({
            target: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            admin: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            roomId: string | null;
            targetId: string | null;
            action: string;
            details: string | null;
            adminId: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
