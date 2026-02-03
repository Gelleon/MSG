import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';

import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with specific origin
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    @Inject(forwardRef(() => RoomsService)) private roomsService: RoomsService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      // Join user specific room
      const userId = payload.sub || payload.userId;
      if (userId) {
        client.join(`user_${userId}`);
      }

      // Handle disconnecting event to access rooms before they are cleared
      client.on('disconnecting', () => {
        const rooms = Array.from(client.rooms);
        // Filter out socket ID room and user specific room
        const chatRooms = rooms.filter(
          (r) => r !== client.id && !r.startsWith('user_'),
        );

        chatRooms.forEach((roomId) => {
          this.server
            .to(roomId)
            .emit('userLeft', { userId: client.data.user.sub });
        });
      });

      console.log(`Client connected: ${client.id}, User: ${payload.username}`);
    } catch (e) {
      console.log('Connection unauthorized');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  async validateRoomAccess(client: Socket, roomId: string): Promise<boolean> {
    const user = client.data.user;
    if (!user) return false;

    // ADMIN and MANAGER have global access
    if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;

    const room = await this.roomsService.findOne(roomId);
    if (!room) return false;

    // Check if user is in room.users
    const isParticipant = (room as any).users.some(
      (u: any) => u.id === user.sub,
    );
    if (isParticipant) return true;

    return false;
  }

  @SubscribeMessage('startPrivateSession')
  async handleStartPrivateSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userIds: string[]; sourceRoomId?: string },
  ) {
    const user = client.data.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // 1. Check if creator is CLIENT
    if (user.role === 'CLIENT') {
      return { error: 'Clients cannot create private sessions' };
    }

    try {
      // 2. Create private room
      // Use a default name, can be updated later or generated based on participants
      const roomName = `Private Chat ${new Date().toISOString()}`;
      const room = await this.roomsService.create({
        name: roomName,
        isPrivate: true,
        parentRoomId: payload.sourceRoomId,
        // projectId is optional, maybe should be passed if linked to a project
      } as any);

      // 3. Add members (this will trigger the check in RoomsService.addUsers)
      const allUserIds = [user.sub || user.userId, ...payload.userIds];
      const updatedRoom = await this.roomsService.addUsers(room.id, allUserIds);

      // 4. Notify participants
      // We need to notify each user individually since they might not be in a shared room yet
      allUserIds.forEach((userId) => {
        this.server
          .to(`user_${userId}`)
          .emit('privateSessionStarted', updatedRoom);
      });

      return updatedRoom;
    } catch (error) {
      console.error('Failed to start private session:', error);
      return { error: error.message || 'Failed to start private session' };
    }
  }

  @SubscribeMessage('closePrivateSession')
  async handleClosePrivateSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Unauthorized');
    }

    // Only ADMIN or MANAGER can close private sessions
    const role = user.role ? user.role.toUpperCase() : '';
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new WsException('Forbidden: Insufficient permissions');
    }

    const roomId = payload.roomId;
    const room = await this.roomsService.findOne(roomId);

    if (!room) {
      throw new WsException('Room not found');
    }

    if (!room.isPrivate) {
      throw new WsException('Not a private session');
    }

    try {
      // Notify participants BEFORE deleting
      this.server.to(roomId).emit('privateSessionClosed', { roomId });

      // Log the action
      console.log(
        `Private session ${roomId} closed by user ${user.sub || user.userId} (${user.role})`,
      );

      // Close and delete the room using the dedicated service method
      // This handles ActionLog creation, cleanup, and cascading deletion in a transaction
      await this.roomsService.closePrivateSession(
        roomId,
        user.sub || user.userId,
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to close private session:', error);
      throw new WsException('Failed to close private session');
    }
  }

  @SubscribeMessage('getRoomUsers')
  async handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    const hasAccess = await this.validateRoomAccess(client, roomId);
    if (!hasAccess) {
      return { error: 'Forbidden' };
    }

    // Get all room members regardless of online status
    const room = await this.roomsService.findOne(roomId);
    if (!room) {
      return [];
    }

    // Map to simple user objects
    // room.members includes user data

    const users = (room as any).members
      .map((member: any) => member.user)
      .filter((user: any) => user.role !== 'CLIENT'); // Server-side validation

    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    const hasAccess = await this.validateRoomAccess(client, roomId);
    if (!hasAccess) {
      return { error: 'Forbidden' };
    }

    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);

    // Broadcast userJoined event with fresh user data
    const userId = client.data.user?.sub || client.data.user?.userId;
    if (userId) {
      const user = await this.usersService.findById(userId);
      if (user && user.role !== 'CLIENT') {
        this.server.to(roomId).emit('userJoined', {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      }
    }

    return { event: 'joinedRoom', data: roomId };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);

    if (client.data.user) {
      this.server.to(roomId).emit('userLeft', { userId: client.data.user.sub });
    }

    return { event: 'leftRoom', data: roomId };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    const user = client.data.user;
    if (!user) return;

    const userId = user.sub || user.userId;
    await this.roomsService.markAsRead(roomId, userId);

    // Notify all sessions of this user
    this.server.to(`user_${userId}`).emit('roomRead', { roomId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentName?: string;
      replyToId?: string;
    },
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        console.log('SendMessage: No user attached to client');
        return;
      }

      console.log(
        `SendMessage request from ${user.username} to room ${payload.roomId}: ${payload.content}`,
      );

      // Verify access again
      const hasAccess = await this.validateRoomAccess(client, payload.roomId);
      if (!hasAccess) {
        console.log(
          `SendMessage: User ${user.username} does not have access to room ${payload.roomId}`,
        );
        client.emit(
          'error',
          'You do not have permission to send messages to this room',
        );
        return;
      }

      const savedMessage = await this.messagesService.create({
        content: payload.content,
        senderId: user.sub,
        roomId: payload.roomId,
        attachmentUrl: payload.attachmentUrl,
        attachmentType: payload.attachmentType,
        attachmentName: payload.attachmentName,
        replyToId: payload.replyToId,
      });

      console.log('Message saved:', savedMessage.id);

      this.server.to(payload.roomId).emit('newMessage', savedMessage);
      return savedMessage;
    } catch (error) {
      console.error('SendMessage error:', error);
      client.emit('error', 'Failed to send message: ' + error.message);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; roomId: string },
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        return;
      }

      console.log(
        `DeleteMessage request from ${user.username} for message ${payload.messageId}`,
      );

      const deletedMessage = await this.messagesService.delete(
        payload.messageId,
        user.sub,
      );

      this.server
        .to(deletedMessage.roomId)
        .emit('messageDeleted', deletedMessage.id);

      return { success: true };
    } catch (error) {
      console.error('DeleteMessage error:', error);
      client.emit('error', 'Failed to delete message: ' + error.message);
    }
  }
}
