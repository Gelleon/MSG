"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const messages_service_1 = require("../messages/messages.service");
const rooms_service_1 = require("../rooms/rooms.service");
const users_service_1 = require("../users/users.service");
let ChatGateway = class ChatGateway {
    jwtService;
    messagesService;
    roomsService;
    usersService;
    server;
    constructor(jwtService, messagesService, roomsService, usersService) {
        this.jwtService = jwtService;
        this.messagesService = messagesService;
        this.roomsService = roomsService;
        this.usersService = usersService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.user = payload;
            const userId = payload.sub || payload.userId;
            if (userId) {
                client.join(`user_${userId}`);
            }
            client.on('disconnecting', () => {
                const rooms = Array.from(client.rooms);
                const chatRooms = rooms.filter(r => r !== client.id && !r.startsWith('user_'));
                chatRooms.forEach(roomId => {
                    this.server.to(roomId).emit('userLeft', { userId: client.data.user.sub });
                });
            });
            console.log(`Client connected: ${client.id}, User: ${payload.username}`);
        }
        catch (e) {
            console.log('Connection unauthorized');
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    async validateRoomAccess(client, roomId) {
        const user = client.data.user;
        if (!user)
            return false;
        if (user.role === 'ADMIN' || user.role === 'MANAGER')
            return true;
        const room = await this.roomsService.findOne(roomId);
        if (!room)
            return false;
        const isParticipant = room.users.some((u) => u.id === user.sub);
        if (isParticipant)
            return true;
        return false;
    }
    async handleStartPrivateSession(client, payload) {
        const user = client.data.user;
        if (!user) {
            throw new websockets_1.WsException('Unauthorized');
        }
        if (user.role === 'CLIENT') {
            throw new websockets_1.WsException('Clients cannot create private sessions');
        }
        try {
            const roomName = `Private Chat ${new Date().toISOString()}`;
            const room = await this.roomsService.create({
                name: roomName,
                isPrivate: true,
                parentRoomId: payload.sourceRoomId,
            });
            const allUserIds = [user.sub || user.userId, ...payload.userIds];
            const updatedRoom = await this.roomsService.addUsers(room.id, allUserIds);
            allUserIds.forEach(userId => {
                this.server.to(`user_${userId}`).emit('privateSessionStarted', updatedRoom);
            });
            return updatedRoom;
        }
        catch (error) {
            console.error('Failed to start private session:', error);
            throw new websockets_1.WsException(error.message || 'Failed to start private session');
        }
    }
    async handleClosePrivateSession(client, payload) {
        const user = client.data.user;
        if (!user) {
            throw new websockets_1.WsException('Unauthorized');
        }
        const role = user.role ? user.role.toUpperCase() : '';
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            throw new websockets_1.WsException('Forbidden: Insufficient permissions');
        }
        const roomId = payload.roomId;
        const room = await this.roomsService.findOne(roomId);
        if (!room) {
            throw new websockets_1.WsException('Room not found');
        }
        if (!room.isPrivate) {
            throw new websockets_1.WsException('Not a private session');
        }
        try {
            this.server.to(roomId).emit('privateSessionClosed', { roomId });
            console.log(`Private session ${roomId} closed by user ${user.sub || user.userId} (${user.role})`);
            await this.roomsService.closePrivateSession(roomId, user.sub || user.userId);
            return { success: true };
        }
        catch (error) {
            console.error('Failed to close private session:', error);
            throw new websockets_1.WsException('Failed to close private session');
        }
    }
    async handleGetRoomUsers(client, roomId) {
        const hasAccess = await this.validateRoomAccess(client, roomId);
        if (!hasAccess) {
            throw new websockets_1.WsException('Forbidden');
        }
        const room = await this.roomsService.findOne(roomId);
        if (!room) {
            return [];
        }
        const users = room.members
            .map((member) => member.user)
            .filter((user) => user.role !== 'CLIENT');
        return users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }));
    }
    async handleJoinRoom(client, roomId) {
        const hasAccess = await this.validateRoomAccess(client, roomId);
        if (!hasAccess) {
            throw new websockets_1.WsException('Forbidden');
        }
        client.join(roomId);
        console.log(`Client ${client.id} joined room ${roomId}`);
        const userId = client.data.user?.sub || client.data.user?.userId;
        if (userId) {
            const user = await this.usersService.findById(userId);
            if (user && user.role !== 'CLIENT') {
                this.server.to(roomId).emit('userJoined', {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                });
            }
        }
        return { event: 'joinedRoom', data: roomId };
    }
    async handleLeaveRoom(client, roomId) {
        client.leave(roomId);
        console.log(`Client ${client.id} left room ${roomId}`);
        if (client.data.user) {
            this.server.to(roomId).emit('userLeft', { userId: client.data.user.sub });
        }
        return { event: 'leftRoom', data: roomId };
    }
    async handleMarkAsRead(client, roomId) {
        const user = client.data.user;
        if (!user)
            return;
        const userId = user.sub || user.userId;
        await this.roomsService.markAsRead(roomId, userId);
        this.server.to(`user_${userId}`).emit('roomRead', { roomId });
    }
    async handleSendMessage(client, payload) {
        try {
            const user = client.data.user;
            if (!user) {
                console.log('SendMessage: No user attached to client');
                return;
            }
            console.log(`SendMessage request from ${user.username} to room ${payload.roomId}: ${payload.content}`);
            const hasAccess = await this.validateRoomAccess(client, payload.roomId);
            if (!hasAccess) {
                console.log(`SendMessage: User ${user.username} does not have access to room ${payload.roomId}`);
                client.emit('error', 'You do not have permission to send messages to this room');
                return;
            }
            const savedMessage = await this.messagesService.create({
                content: payload.content,
                senderId: user.sub,
                roomId: payload.roomId,
                attachmentUrl: payload.attachmentUrl,
                attachmentType: payload.attachmentType,
                attachmentName: payload.attachmentName,
            });
            console.log('Message saved:', savedMessage.id);
            this.server.to(payload.roomId).emit('newMessage', savedMessage);
            return savedMessage;
        }
        catch (error) {
            console.error('SendMessage error:', error);
            client.emit('error', 'Failed to send message: ' + error.message);
        }
    }
    async handleDeleteMessage(client, payload) {
        try {
            const user = client.data.user;
            if (!user) {
                return;
            }
            console.log(`DeleteMessage request from ${user.username} for message ${payload.messageId}`);
            const deletedMessage = await this.messagesService.delete(payload.messageId, user.sub);
            this.server.to(deletedMessage.roomId).emit('messageDeleted', deletedMessage.id);
            return { success: true };
        }
        catch (error) {
            console.error('DeleteMessage error:', error);
            client.emit('error', 'Failed to delete message: ' + error.message);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('startPrivateSession'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleStartPrivateSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('closePrivateSession'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleClosePrivateSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRoomUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetRoomUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => rooms_service_1.RoomsService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        messages_service_1.MessagesService,
        rooms_service_1.RoomsService,
        users_service_1.UsersService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map