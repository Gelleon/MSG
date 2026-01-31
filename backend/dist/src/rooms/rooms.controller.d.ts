import { RoomsService } from './rooms.service';
import { Prisma } from '@prisma/client';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    create(createRoomDto: Prisma.RoomUncheckedCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isPrivate: boolean;
        description: string | null;
        projectId: string | null;
        parentRoomId: string | null;
    }>;
    findAll(projectId: string, req: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
    markAsRead(id: string, req: any): Promise<{
        success: boolean;
    }>;
    joinRoom(id: string, userId: string, req: any): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
    addMembers(id: string, userIds: string[]): Promise<{
        users: {
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
    getMembers(id: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            joinedAt: Date;
            id: string;
            email: string;
            password: string;
            name: string | null;
            role: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    update(id: string, updateRoomDto: Prisma.RoomUpdateInput): Promise<{
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
    removeMember(roomId: string, userId: string, reason: string, req: any): Promise<{
        success: boolean;
    }>;
    getRoomLogs(roomId: string, page?: string, limit?: string): Promise<{
        data: ({
            target: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                resetToken: string | null;
                resetTokenExpires: Date | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            admin: {
                id: string;
                email: string;
                password: string;
                name: string | null;
                role: string;
                resetToken: string | null;
                resetTokenExpires: Date | null;
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
