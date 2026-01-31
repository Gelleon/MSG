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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const chat_gateway_1 = require("../chat/chat.gateway");
let RoomsService = class RoomsService {
    prisma;
    chatGateway;
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    async validateRoomName(name, excludeRoomId) {
        if (!name || !name.trim()) {
            throw new Error('Название комнаты не может быть пустым');
        }
        const trimmedName = name.trim();
        if (trimmedName.length > 100) {
            throw new Error('Название комнаты слишком длинное (максимум 100 символов)');
        }
        const existing = await this.prisma.room.findFirst({
            where: {
                name: {
                    equals: trimmedName,
                },
                id: excludeRoomId ? { not: excludeRoomId } : undefined,
            },
        });
        if (existing) {
            throw new Error('Комната с таким названием уже существует');
        }
        return trimmedName;
    }
    async create(data) {
        const validatedName = await this.validateRoomName(data.name);
        try {
            return await this.prisma.room.create({
                data: {
                    ...data,
                    name: validatedName,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error('Комната с таким названием уже существует');
            }
            throw error;
        }
    }
    async findAll(projectId, user) {
        const where = projectId ? { projectId } : {};
        if (user && user.role === 'CLIENT') {
            where.members = {
                some: {
                    userId: user.userId,
                },
            };
        }
        const rooms = await this.prisma.room.findMany({
            where,
            include: {
                parentRoom: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
            let unreadCount = 0;
            if (user) {
                const member = room.members.find((m) => m.userId === user.userId);
                if (member) {
                    unreadCount = await this.prisma.message.count({
                        where: {
                            roomId: room.id,
                            createdAt: { gt: member.lastReadAt },
                        },
                    });
                }
            }
            return {
                ...room,
                users: room.members.map((m) => m.user),
                unreadCount,
            };
        }));
        return roomsWithCounts;
    }
    async markAsRead(roomId, userId) {
        const member = await this.prisma.roomMember.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId,
                },
            },
        });
        if (member) {
            await this.prisma.roomMember.update({
                where: {
                    id: member.id,
                },
                data: {
                    lastReadAt: new Date(),
                },
            });
        }
    }
    async findOne(id, user) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                parentRoom: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!room)
            return null;
        if (user && user.role === 'CLIENT') {
            const isMember = room.members.some(m => m.userId === user.userId);
            if (!isMember)
                return null;
        }
        let messageWhere = { roomId: id };
        if (user && user.role === 'CLIENT') {
            const membership = room.members.find((m) => m.userId === user.userId);
            if (membership) {
                messageWhere.createdAt = {
                    gte: membership.joinedAt,
                };
            }
        }
        const messages = await this.prisma.message.findMany({
            where: messageWhere,
            include: { sender: true },
            orderBy: { createdAt: 'asc' },
        });
        return {
            ...room,
            users: room.members.map((m) => m.user),
            messages,
        };
    }
    async delete(id) {
        return this.prisma.$transaction(async (tx) => {
            await tx.actionLog.deleteMany({
                where: { roomId: id },
            });
            return tx.room.delete({
                where: { id },
            });
        });
    }
    async closePrivateSession(roomId, adminId) {
        const room = await this.findOne(roomId);
        if (!room)
            throw new Error('Room not found');
        return this.prisma.$transaction(async (tx) => {
            await tx.actionLog.create({
                data: {
                    action: 'CLOSE_PRIVATE_SESSION',
                    details: `Private session ${room.name} (${roomId}) closed and deleted${adminId ? '' : ' by SYSTEM'}`,
                    adminId: adminId || null,
                },
            });
            await tx.actionLog.deleteMany({
                where: { roomId },
            });
            return tx.room.delete({
                where: { id: roomId },
            });
        });
    }
    async addUser(roomId, userId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { members: true },
        });
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.isPrivate) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (user && user.role === 'CLIENT') {
                throw new Error('Clients cannot be added to private rooms');
            }
        }
        const isUserInRoom = room.members.some((member) => member.userId === userId);
        if (!isUserInRoom) {
            await this.prisma.roomMember.create({
                data: {
                    roomId,
                    userId,
                },
            });
        }
        return this.findOne(roomId);
    }
    async findInactivePrivateRooms(threshold) {
        return this.prisma.room.findMany({
            where: {
                isPrivate: true,
                updatedAt: {
                    lt: threshold,
                },
            },
        });
    }
    async addUsers(roomId, userIds) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { members: true },
        });
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.isPrivate) {
            const users = await this.prisma.user.findMany({
                where: {
                    id: { in: userIds }
                }
            });
            const hasClient = users.some(u => u.role === 'CLIENT');
            if (hasClient) {
                throw new Error('Clients cannot be added to private rooms');
            }
        }
        const existingMemberIds = new Set(room.members.map(m => m.userId));
        const newMembers = userIds.filter(id => !existingMemberIds.has(id));
        if (newMembers.length > 0) {
            await this.prisma.roomMember.createMany({
                data: newMembers.map(userId => ({
                    roomId,
                    userId,
                })),
            });
        }
        return this.findOne(roomId);
    }
    async getMembers(roomId, params) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;
        const where = {
            roomId,
        };
        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            };
        }
        const [total, members] = await Promise.all([
            this.prisma.roomMember.count({ where }),
            this.prisma.roomMember.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: true,
                },
                orderBy: {
                    joinedAt: 'desc',
                },
            }),
        ]);
        return {
            data: members.map((m) => ({
                ...m.user,
                joinedAt: m.joinedAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async update(id, data) {
        if (typeof data.name === 'string') {
            data.name = await this.validateRoomName(data.name, id);
        }
        try {
            return await this.prisma.room.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error('Комната с таким названием уже существует');
            }
            throw error;
        }
    }
    async remove(id) {
        return this.delete(id);
    }
    async removeMember(roomId, userId, adminId, reason) {
        return this.prisma.$transaction(async (tx) => {
            const member = await tx.roomMember.findUnique({
                where: {
                    userId_roomId: {
                        userId,
                        roomId,
                    },
                },
            });
            if (!member) {
                throw new Error('Member not found in room');
            }
            await tx.actionLog.create({
                data: {
                    action: 'REMOVE_USER',
                    details: reason || 'Member removed by admin',
                    adminId,
                    targetId: userId,
                    roomId,
                },
            });
            await tx.roomMember.delete({
                where: {
                    userId_roomId: {
                        userId,
                        roomId,
                    },
                },
            });
            return { success: true };
        });
    }
    async getRoomLogs(roomId, page, limit) {
        const skip = (page - 1) * limit;
        const [total, logs] = await Promise.all([
            this.prisma.actionLog.count({ where: { roomId } }),
            this.prisma.actionLog.findMany({
                where: { roomId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: true,
                    target: true,
                },
            }),
        ]);
        return {
            data: logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map