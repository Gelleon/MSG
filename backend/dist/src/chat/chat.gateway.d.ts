import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private messagesService;
    private roomsService;
    private usersService;
    server: Server;
    constructor(jwtService: JwtService, messagesService: MessagesService, roomsService: RoomsService, usersService: UsersService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    validateRoomAccess(client: Socket, roomId: string): Promise<boolean>;
    handleStartPrivateSession(client: Socket, payload: {
        userIds: string[];
        sourceRoomId?: string;
    }): Promise<{
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
    handleClosePrivateSession(client: Socket, payload: {
        roomId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleGetRoomUsers(client: Socket, roomId: string): Promise<any>;
    handleJoinRoom(client: Socket, roomId: string): Promise<{
        event: string;
        data: string;
    }>;
    handleLeaveRoom(client: Socket, roomId: string): Promise<{
        event: string;
        data: string;
    }>;
    handleMarkAsRead(client: Socket, roomId: string): Promise<void>;
    handleSendMessage(client: Socket, payload: {
        roomId: string;
        content: string;
        attachmentUrl?: string;
        attachmentType?: string;
        attachmentName?: string;
    }): Promise<{
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
    } | undefined>;
    handleDeleteMessage(client: Socket, payload: {
        messageId: string;
        roomId: string;
    }): Promise<{
        success: boolean;
    } | undefined>;
}
